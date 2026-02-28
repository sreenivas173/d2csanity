# TODO: Fix and Validate D2C Settings File ViewDownload Test

## Steps to Complete
- [x] Analyze the failing test in `tests/13_D2C_Settings_File_ViewDownload.spec.ts`
- [x] Identify issues in `pages/SettingsPage.ts` methods `downloadFile` and `viewFileContent` (likely timing/flakiness with hover and dropdown)
- [x] Update `downloadFile` method to add more robust waits and retries to prevent flakiness
- [x] Update `viewFileContent` method similarly for robustness
- [x] Run the specific test `tests/13_D2C_Settings_File_ViewDownload.spec.ts` to verify fix
- [x] Wait for test results and confirm both tests pass
- [x] Fix login tests that were failing due to captcha
- [x] Run all tests to check status
- [x] Task completed successfully - main test passes, login tests fixed for captcha
- [ ] Other tests have unrelated failures (MM design, DBL filter/pagination, templates) - not part of this task scope
