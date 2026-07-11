// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ZyncVesting — linear token vesting with a cliff
/// @notice Admin funds the contract with ZYNC and creates vesting schedules for
///         beneficiaries. Beneficiaries pull their vested tokens via `release()`.
/// @dev Solvency invariant: the contract's ZYNC balance always covers the sum of
///      unreleased allocations (`totalCommitted`). A schedule that would break this
///      cannot be created. This guarantees every beneficiary can always be paid.
/// @dev Vesting model: nothing before `cliff`; at `cliff` the amount accrued since
///      `start` unlocks at once; then linear to `start + duration`.
/// @dev Non-goal (v1): schedules are irrevocable by design. Admin revocation would
///      reintroduce the trust problem vesting exists to remove.
contract ZyncVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Schedule {
        uint256 total;     // total tokens in this schedule
        uint256 released;  // amount already claimed
        uint64 start;      // vesting start timestamp
        uint64 cliff;      // no tokens claimable before this timestamp
        uint64 duration;   // full vesting length from `start`
    }

    /// @notice The vested token.
    IERC20 public immutable token;

    /// @notice Schedules per beneficiary (a beneficiary may hold several grants).
    mapping(address => Schedule[]) private _schedules;

    /// @notice Sum of all unreleased allocations. The contract balance must always
    ///         cover this; it is the solvency invariant made explicit.
    uint256 public totalCommitted;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidSchedule();
    error InsufficientFunds();   // allocation would exceed funded, unallocated balance
    error NothingToRelease();
    error NoSuchSchedule();

    event ScheduleCreated(
        address indexed beneficiary,
        uint256 indexed scheduleId,
        uint256 total,
        uint64 start,
        uint64 cliff,
        uint64 duration
    );
    event Released(address indexed beneficiary, uint256 indexed scheduleId, uint256 amount);
    event Funded(address indexed from, uint256 amount);

    constructor(IERC20 vestedToken) Ownable(msg.sender) {
        if (address(vestedToken) == address(0)) revert ZeroAddress();
        token = vestedToken;
    }

    /// @notice Deposit ZYNC into the contract to back future schedules.
    /// @dev Caller must have approved this contract for `amount` first.
    function fund(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(msg.sender, amount);
    }

    /// @notice Create a vesting schedule for `beneficiary`.
    /// @dev Reverts unless the contract holds enough unallocated tokens to fully
    ///      back this schedule, preserving the solvency invariant.
    function createSchedule(
        address beneficiary,
        uint256 amount,
        uint64 start,
        uint64 cliff,
        uint64 duration
    ) external onlyOwner returns (uint256 scheduleId) {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        // duration must be positive; cliff must sit within [start, start+duration].
        if (duration == 0 || cliff < start || cliff > start + duration) revert InvalidSchedule();

        // Solvency: unallocated balance = held tokens - already committed. The new
        // allocation must fit inside it, so every schedule stays fully backed.
        uint256 unallocated = token.balanceOf(address(this)) - totalCommitted;
        if (amount > unallocated) revert InsufficientFunds();

        totalCommitted += amount; // effect: commit before handing back the id

        scheduleId = _schedules[beneficiary].length;
        _schedules[beneficiary].push(
            Schedule({ total: amount, released: 0, start: start, cliff: cliff, duration: duration })
        );

        emit ScheduleCreated(beneficiary, scheduleId, amount, start, cliff, duration);
    }

    /// @notice Claim all currently-vested, unreleased tokens for one schedule.
    /// @dev CEI: compute -> update released/totalCommitted -> transfer. nonReentrant
    ///      is defense in depth on top of that ordering.
    function release(uint256 scheduleId) external nonReentrant {
        Schedule[] storage list = _schedules[msg.sender];
        if (scheduleId >= list.length) revert NoSuchSchedule();

        Schedule storage s = list[scheduleId];
        uint256 releasable = _vestedAmount(s, block.timestamp) - s.released;
        if (releasable == 0) revert NothingToRelease();

        // EFFECTS first: mark released and free the commitment before transferring.
        s.released += releasable;
        totalCommitted -= releasable;

        // INTERACTION last.
        token.safeTransfer(msg.sender, releasable);
        emit Released(msg.sender, scheduleId, releasable);
    }

    // --- views ---------------------------------------------------------------

    /// @notice Tokens claimable right now for a beneficiary's schedule.
    function releasable(address beneficiary, uint256 scheduleId) external view returns (uint256) {
        Schedule[] storage list = _schedules[beneficiary];
        if (scheduleId >= list.length) return 0;
        Schedule storage s = list[scheduleId];
        return _vestedAmount(s, block.timestamp) - s.released;
    }

    /// @notice Number of schedules a beneficiary holds.
    function scheduleCount(address beneficiary) external view returns (uint256) {
        return _schedules[beneficiary].length;
    }

    /// @notice Read a schedule.
    function getSchedule(address beneficiary, uint256 scheduleId)
        external
        view
        returns (Schedule memory)
    {
        if (scheduleId >= _schedules[beneficiary].length) revert NoSuchSchedule();
        return _schedules[beneficiary][scheduleId];
    }

    // --- internal vesting math ----------------------------------------------

    /// @dev Total vested by `timestamp`: 0 before cliff, `total` after the end,
    ///      linear in between. Multiply before divide to preserve precision.
    function _vestedAmount(Schedule storage s, uint256 timestamp) private view returns (uint256) {
        if (timestamp < s.cliff) {
            return 0;
        }
        uint256 end = uint256(s.start) + s.duration;
        if (timestamp >= end) {
            return s.total;
        }
        // elapsed is measured from start (not cliff): the cliff gates *when* tokens
        // become claimable, but the linear schedule accrues from start.
        uint256 elapsed = timestamp - s.start;
        return (s.total * elapsed) / s.duration;
    }
}