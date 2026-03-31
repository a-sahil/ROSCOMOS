# Flow Transaction Scheduler - Execution Flow Diagram

## Where Does the Scheduler Execute? Complete Trace

---

## Phase 1: SETUP (User Action)

### Transaction: `schedule_circle_automated.cdc`

**File**: `cadence/transactions/schedule_circle_automated.cdc`

```
USER SENDS TRANSACTION
        ↓
┌───────────────────────────────────────────────────────────┐
│ schedule_circle_automated.cdc (Lines 19-117)              │
├───────────────────────────────────────────────────────────┤
│                                                             │
│ Line 37: Create Handler                                    │
│   let handler <- ROSCOMOSTransactionHandler.createHandler(│
│       circleId: circleId,                                  │
│       cycleDuration: cycleDuration                         │
│   )                                                        │
│                                                             │
│ Line 43-44: Save to Storage                               │
│   let handlerPath = StoragePath(                          │
│       identifier: "ROSCOMOSHandler_3"                    │
│   )                                                        │
│   signer.storage.save(<-handler, to: handlerPath)         │
│                                                             │
│ Line 47-49: Issue Capability                              │
│   let handlerCap = signer.capabilities.storage.issue<     │
│       auth(FlowTransactionScheduler.Execute)              │
│       &{FlowTransactionScheduler.TransactionHandler}      │
│   >(handlerPath)                                          │
│                                                             │
│ Line 87-92: Estimate Fees (Flow API Call)                │
│   let est = FlowTransactionScheduler.estimate(            │
│       data: nil,                                          │
│       timestamp: executeAt,  // 1760138551               │
│       priority: FlowTransactionScheduler.Priority.Medium, │
│       executionEffort: 1000                               │
│   )                                                        │
│   → Returns: fees = 0.00125460 FLOW                      │
│                                                             │
│ Line 98-105: SCHEDULE IT! (Flow API Call)                │
│   let txId = manager.schedule(                            │
│       handlerCap: handlerCap,   // ← Points to Handler   │
│       data: nil,                                          │
│       timestamp: executeAt,      // ← When: 1760138551   │
│       priority: Medium,                                   │
│       executionEffort: 1000,                              │
│       fees: <-fees              // ← Pay upfront         │
│   )                                                        │
│   → Returns: txId = 13105                                │
│                                                             │
└───────────────────────────────────────────────────────────┘
        ↓
Flow Blockchain Stores:
- Scheduled Transaction ID: 13105
- Handler Capability: Points to /storage/ROSCOMOSHandler_3
- Execution Timestamp: 1760138551
- Fees: 0.00125460 FLOW (paid)
        ↓
EVENT EMITTED: FlowTransactionScheduler.Scheduled
{
  "id": 13105,
  "timestamp": 1760138551,
  "transactionHandlerOwner": "0xa89655a0f8e3d113",
  "transactionHandlerTypeIdentifier": "ROSCOMOSTransactionHandler.Handler",
  "fees": 0.00125460
}
```

**KEY LOCATION**: `schedule_circle_automated.cdc:98-105` is where we tell Flow's scheduler to execute our handler at a future time.

---

## Phase 2: WAITING (No Human Action)

```
Time passes...
Current Block Timestamp: 1760138463
Target Execution Time:   1760138551
Waiting: 88 seconds

┌─────────────────────────────────────────┐
│  Flow Blockchain Internal Scheduler     │
│  (Part of Flow Protocol)                │
│                                         │
│  Every block, checks:                   │
│  - Is current timestamp >= 1760138551?  │
│  - If yes, execute transaction 13105    │
└─────────────────────────────────────────┘

⏰ Time: 1760138551
✅ Condition met: Execute transaction 13105
```

---

## Phase 3: AUTOMATED EXECUTION (Flow Blockchain Action)

### Step 1: Flow Scheduler Calls Handler

**Flow's Internal Process** (not visible to users, happens inside Flow node):

```
Flow Transaction Scheduler (Internal)
        ↓
Looks up Transaction 13105
        ↓
Gets Handler Capability from storage:
  /storage/ROSCOMOSHandler_3
        ↓
Borrows Handler with Execute entitlement
        ↓
CALLS: Handler.executeTransaction(id: 13105, data: nil)
```

### Step 2: Handler Executes

**File**: `cadence/contracts/ROSCOMOSTransactionHandler.cdc`

```
┌────────────────────────────────────────────────────────────┐
│ ROSCOMOSTransactionHandler.cdc                             │
│ Handler.executeTransaction(id: 13105, data: nil)           │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Line 22-23: Function Declaration                           │
│   access(FlowTransactionScheduler.Execute)                 │
│   fun executeTransaction(id: UInt64, data: AnyStruct?) {   │
│                                ↑                            │
│                          SCHEDULER CALLS THIS!              │
│                                                              │
│ Line 25: Check if Ready                                    │
│   if !ROSCOMOS.canPullContributions(circleId: 3) {         │
│       return  // Not ready yet                             │
│   }                                                         │
│   → Calls ROSCOMOS.cdc:198-204 (canPullContributions)      │
│   → Returns: true (60 seconds passed!)                     │
│                                                              │
│ Line 31-35: Check Circle Status                           │
│   let circleInfo = ROSCOMOS.getCircleInfo(circleId: 3)    │
│   let status = circleInfo!["status"]                       │
│   if status == Completed || status == Cancelled {          │
│       return                                                │
│   }                                                         │
│   → Status is Active, continue!                            │
│                                                              │
│ Line 44: THE MAGIC - AUTOMATED PULL! 🔥                   │
│   ROSCOMOS.scheduledPullContributions(circleId: 3)         │
│            ↓                                                │
│            Calls ROSCOMOS contract!                         │
│                                                              │
│ Line 46-49: Log Execution                                  │
│   self.executionCount = self.executionCount + 1            │
│   log("Executed contribution pull #1 for circle 3...")     │
│                                                              │
└────────────────────────────────────────────────────────────┘
        ↓
    Next: ROSCOMOS.scheduledPullContributions()
```

**KEY LOCATION**: `ROSCOMOSTransactionHandler.cdc:44` is where the handler calls into ROSCOMOS to pull contributions.

### Step 3: ROSCOMOS Pulls Contributions

**File**: `cadence/contracts/ROSCOMOS.cdc`

```
┌────────────────────────────────────────────────────────────┐
│ ROSCOMOS.cdc                                                │
│ scheduledPullContributions(circleId: 3)                    │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Line 183-188: Get Circle Reference                         │
│   access(all) fun scheduledPullContributions(circleId: UInt64) {│
│       let circleRef = &self.circles[circleId] as &Circle?  │
│           ?? panic("Circle does not exist")                │
│                                                              │
│       circleRef.pullContributions()  ← Calls next function │
│   }                                                         │
│                                                              │
└────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────┐
│ Circle.pullContributions() - Line 175-210                  │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Line 175: Function Declaration                             │
│   access(all) fun pullContributions() {                    │
│                                                              │
│ Line 176-179: Preconditions                                │
│   pre {                                                     │
│       self.status == CircleStatus.Active                   │
│       self.canPullContributions()  // Check time           │
│   }                                                         │
│                                                              │
│ Line 182-206: Pull from Each Member                        │
│   for address in self.memberOrder {                        │
│       // Get member's vault capability                      │
│       let vaultCap = self.memberVaultCaps[address]!        │
│       let vaultRef = vaultCap.borrow()                     │
│                                                              │
│       // WITHDRAW FUNDS AUTOMATICALLY! 💰                  │
│       let payment <- vaultRef.withdraw(                    │
│           amount: self.contributionAmount  // 5.0 FLOW     │
│       )                                                     │
│                                                              │
│       // Deposit into circle vault                          │
│       self.vault.deposit(from: <- payment)                 │
│                                                              │
│       // Update member record                               │
│       self.members[address]!.recordContribution(5.0)       │
│                                                              │
│       // Emit event                                         │
│       emit ContributionPulled(...)                         │
│   }                                                         │
│                                                              │
│ Line 209: Immediately Distribute Payout                    │
│   self.distributePayout()  ← Calls next function          │
│                                                              │
└────────────────────────────────────────────────────────────┘
        ↓
    Next: distributePayout()
```

**KEY LOCATIONS**:
- `ROSCOMOS.cdc:183` - Entry point called by handler
- `ROSCOMOS.cdc:194` - **WHERE FUNDS ARE WITHDRAWN** using vault capability

### Step 4: Distribute Payout

```
┌────────────────────────────────────────────────────────────┐
│ Circle.distributePayout() - Line 213-257                   │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Line 213: Function Declaration                             │
│   access(self) fun distributePayout() {                    │
│                                                              │
│ Line 219: Get Recipient                                    │
│   let recipientAddress = self.memberOrder[                 │
│       self.currentPayoutPosition  // Position 0           │
│   ]                                                         │
│   → recipientAddress = 0xa89655a0f8e3d113                 │
│                                                              │
│ Line 220: Calculate Payout                                 │
│   let payoutAmount = self.contributionAmount *             │
│                      UFix64(self.numberOfMembers)          │
│   → payoutAmount = 5.0 * 1 = 5.0 FLOW                     │
│                                                              │
│ Line 223-226: Get Recipient's Receiver                    │
│   let receiverCap = getAccount(recipientAddress)           │
│       .capabilities.get<&{FungibleToken.Receiver}>(        │
│           /public/flowTokenReceiver                        │
│       )                                                     │
│       .borrow()                                             │
│                                                              │
│ Line 229-230: SEND PAYOUT! 💸                             │
│   let payout <- self.vault.withdraw(amount: 5.0)          │
│   receiverCap.deposit(from: <- payout)                    │
│                                                              │
│ Line 233: Mark Member as Paid                             │
│   self.members[recipientAddress]!.markPayoutReceived()    │
│                                                              │
│ Line 235-242: Emit Events                                 │
│   emit PayoutDistributed(...)                             │
│   emit CycleCompleted(...)                                │
│                                                              │
│ Line 245: Increment Position                              │
│   self.currentPayoutPosition = self.currentPayoutPosition + 1│
│   → currentPayoutPosition now = 1                          │
│                                                              │
│ Line 248-251: Check if Complete                           │
│   if self.currentPayoutPosition >= self.numberOfMembers {  │
│       self.status = CircleStatus.Completed                │
│       emit CircleCompleted(circleId: 3)                   │
│   }                                                         │
│   → Status changed to Completed!                           │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**KEY LOCATIONS**:
- `ROSCOMOS.cdc:229-230` - **WHERE PAYOUT IS SENT**
- `ROSCOMOS.cdc:249` - **WHERE STATUS CHANGES TO COMPLETED**

---

## Phase 4: RESULT (Observable on Blockchain)

```
EVENTS EMITTED (visible on testnet):
1. ContributionPulled
   - circleId: 3
   - member: 0xa89655a0f8e3d113
   - amount: 5.0
   - cycle: 1

2. PayoutDistributed
   - circleId: 3
   - recipient: 0xa89655a0f8e3d113
   - amount: 5.0
   - cycle: 1

3. CycleCompleted
   - circleId: 3
   - cycle: 1

4. CircleCompleted
   - circleId: 3

CIRCLE STATE CHANGES (visible via scripts):
Before:
  status: Active (rawValue: 1)
  currentPayoutPosition: 0

After:
  status: Completed (rawValue: 2)  ✅ CHANGED!
  currentPayoutPosition: 1          ✅ CHANGED!
```

---

## Complete Execution Call Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 1. Flow Transaction Scheduler (Flow Protocol Internal)       │
│    - Timestamp check: 1760138551 >= 1760138551 ✅           │
│    - Lookup transaction 13105                                │
│    - Load handler capability from /storage/ROSCOMOSHandler_3 │
│         ↓                                                     │
│                                                               │
│ 2. ROSCOMOSTransactionHandler.cdc:23                         │
│    Handler.executeTransaction(id: 13105, data: nil)          │
│    ├─ Line 25: canPullContributions() → true                │
│    ├─ Line 31: getCircleInfo() → status Active              │
│    └─ Line 44: Call scheduledPullContributions()            │
│         ↓                                                     │
│                                                               │
│ 3. ROSCOMOS.cdc:183                                          │
│    scheduledPullContributions(circleId: 3)                   │
│    └─ Line 187: Call circleRef.pullContributions()          │
│         ↓                                                     │
│                                                               │
│ 4. ROSCOMOS.cdc:175                                          │
│    Circle.pullContributions()                                │
│    ├─ Line 194: vaultRef.withdraw(5.0) 💰                   │
│    ├─ Line 195: vault.deposit()                             │
│    ├─ Line 200: Emit ContributionPulled                     │
│    └─ Line 209: Call distributePayout()                     │
│         ↓                                                     │
│                                                               │
│ 5. ROSCOMOS.cdc:213                                          │
│    Circle.distributePayout()                                 │
│    ├─ Line 229: vault.withdraw(5.0)                         │
│    ├─ Line 230: receiverCap.deposit() 💸                    │
│    ├─ Line 235: Emit PayoutDistributed                      │
│    ├─ Line 242: Emit CycleCompleted                         │
│    ├─ Line 245: currentPayoutPosition = 1                   │
│    ├─ Line 249: status = Completed                          │
│    └─ Line 250: Emit CircleCompleted                        │
│         ↓                                                     │
│                                                               │
│ ✅ EXECUTION COMPLETE - ALL AUTOMATED!                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Code Locations

### Where Scheduler Execution Starts:
**File**: `cadence/contracts/ROSCOMOSTransactionHandler.cdc`
**Line**: 22-23
```cadence
access(FlowTransactionScheduler.Execute)
fun executeTransaction(id: UInt64, data: AnyStruct?) {
```
👆 **Flow Transaction Scheduler calls THIS function automatically**

### Where Funds Are Withdrawn:
**File**: `cadence/contracts/ROSCOMOS.cdc`
**Line**: 194
```cadence
let payment <- vaultRef.withdraw(amount: self.contributionAmount)
```
👆 **This uses the vault capability members provided at join time**

### Where Payout Is Sent:
**File**: `cadence/contracts/ROSCOMOS.cdc`
**Line**: 229-230
```cadence
let payout <- self.vault.withdraw(amount: payoutAmount)
receiverCap.deposit(from: <- payout)
```
👆 **This sends the payout to the recipient**

### Where Status Changes:
**File**: `cadence/contracts/ROSCOMOS.cdc`
**Line**: 249
```cadence
self.status = CircleStatus.Completed
```
👆 **This is why we see status change from 1 → 2**

---

## How to Verify Scheduler Execution

### 1. Check Scheduled Event:
```bash
# Look for FlowTransactionScheduler.Scheduled event in schedule transaction
flow transactions get 062b27c09897d61230333b3c2b9f68557552dfbd1113055b38e6455de8b4f57b --network testnet

# Event Index 5 shows:
# - id: 13105
# - timestamp: 1760138551
# - transactionHandlerTypeIdentifier: ROSCOMOSTransactionHandler.Handler
```

### 2. Check State Before:
```bash
flow scripts execute cadence/scripts/get_circle_info_testnet.cdc \
  --args-json '[{"type": "UInt64", "value": "3"}]' \
  --network testnet

# Before execution (T=0):
# status: Active (rawValue: 1)
# currentPayoutPosition: 0
```

### 3. Wait for Execution Time:
```bash
# Wait until current timestamp >= 1760138551
sleep 65
```

### 4. Check State After:
```bash
flow scripts execute cadence/scripts/get_circle_info_testnet.cdc \
  --args-json '[{"type": "UInt64", "value": "3"}]' \
  --network testnet

# After automatic execution (T=65s):
# status: Completed (rawValue: 2)  ← CHANGED!
# currentPayoutPosition: 1          ← CHANGED!
```

### 5. Confirm No Manual Trigger:
```bash
# Check your transaction history - you should see:
# ✅ create_circle_testnet.cdc
# ✅ join_circle_testnet.cdc
# ✅ schedule_circle_automated.cdc
# ❌ NO pull_contributions_testnet.cdc ← Proves automation!
```

---

## Summary: Where Execution Happens

| Phase | Location | What Happens |
|-------|----------|--------------|
| **Setup** | `schedule_circle_automated.cdc:98-105` | User schedules execution with Flow |
| **Trigger** | Flow Protocol (Internal) | Blockchain checks timestamp, triggers execution |
| **Entry Point** | `ROSCOMOSTransactionHandler.cdc:23` | Scheduler calls `executeTransaction()` |
| **Pull** | `ROSCOMOS.cdc:194` | Withdraw funds from member vaults |
| **Payout** | `ROSCOMOS.cdc:230` | Distribute payout to recipient |
| **Complete** | `ROSCOMOS.cdc:249` | Mark circle as completed |

**The key insight**: Flow Transaction Scheduler is part of Flow Protocol itself. It runs on Flow nodes, not on your local machine. When the blockchain timestamp reaches the scheduled time, Flow automatically executes the handler - no manual trigger needed!
