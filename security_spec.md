# Security Specification - SleepWell

## Data Invariants
1. A user can only access their own profile.
2. A user can only manage their own sleep logs.
    - `userId` in a log must match the authenticated user's ID.
3. `startTime` must be before `endTime`.
4. `quality` must be between 1 and 5.
5. `createdAt` must be set by the server.

## The "Dirty Dozen" Payloads (All should be PERMISSION_DENIED)

1. **Identity Theft (Profile)**: Attempt to create/update another user's profile.
2. **Identity Theft (Log)**: Attempt to create a sleep log for another user.
3. **Log Siphoning**: Attempt to list all sleep logs without filtering by UID.
4. **Spoofed Quality**: Attempt to save a sleep log with `quality: 10`.
5. **Shadow Fields**: Attempt to add a `isVerified: true` field to a user profile.
6. **Future Forgery**: Setting a client-side `createdAt` in the future.
7. **Cross-User Updates**: Logged-in User A trying to update User B's sleep log `endTime`.
8. **跨-User Deletion**: User A trying to delete User B's logs.
9. **Unverified Write**: User with `email_verified: false` trying to log sleep (if we enforce verification).
10. **ID Poisoning**: Attempt to create a log with a 2KB string as the document ID.
11. **Negative Sleep**: `startTime` > `endTime`.
12. **System Field Tampering**: Overwriting `createdAt` on update.

## Test Strategy
- We will use `firebase/rules-unit-testing` logic conceptually in our rules to block these.
- Since we don't have a test runner in this environment, we rely on rule enforcement.
