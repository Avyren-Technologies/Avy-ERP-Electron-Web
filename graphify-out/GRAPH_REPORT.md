# Graph Report - .  (2026-05-01)

## Corpus Check
- 423 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3170 nodes · 3418 edges · 54 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 566 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Company Admin Screens|Company Admin Screens]]
- [[_COMMUNITY_Recruitment API|Recruitment API]]
- [[_COMMUNITY_ESS Query Hooks|ESS Query Hooks]]
- [[_COMMUNITY_Analytics Dashboard Screens|Analytics Dashboard Screens]]
- [[_COMMUNITY_File Upload & R2|File Upload & R2]]
- [[_COMMUNITY_Invoice Query Hooks|Invoice Query Hooks]]
- [[_COMMUNITY_HR Feature Screens|HR Feature Screens]]
- [[_COMMUNITY_ESS Expense Claims|ESS Expense Claims]]
- [[_COMMUNITY_Auth API|Auth API]]
- [[_COMMUNITY_Company Admin Query Hooks|Company Admin Query Hooks]]
- [[_COMMUNITY_HR Query Hooks|HR Query Hooks]]
- [[_COMMUNITY_User Management Screen|User Management Screen]]
- [[_COMMUNITY_Leave Policy Screen|Leave Policy Screen]]
- [[_COMMUNITY_PRD & Entry Point|PRD & Entry Point]]
- [[_COMMUNITY_My Profile Screen|My Profile Screen]]
- [[_COMMUNITY_Succession Planning|Succession Planning]]
- [[_COMMUNITY_Designation Screen|Designation Screen]]
- [[_COMMUNITY_Leave Balance Screen|Leave Balance Screen]]
- [[_COMMUNITY_Salary Structure Screen|Salary Structure Screen]]
- [[_COMMUNITY_Leave Request Screen|Leave Request Screen]]
- [[_COMMUNITY_Tax Config Screen|Tax Config Screen]]
- [[_COMMUNITY_Support Ticket Chat|Support Ticket Chat]]
- [[_COMMUNITY_Cost Centre Screen|Cost Centre Screen]]
- [[_COMMUNITY_Role Management Screen|Role Management Screen]]
- [[_COMMUNITY_Visitor Pre-register|Visitor Pre-register]]
- [[_COMMUNITY_Department Screen|Department Screen]]
- [[_COMMUNITY_Payslip Screen|Payslip Screen]]
- [[_COMMUNITY_Employee Salary Screen|Employee Salary Screen]]
- [[_COMMUNITY_Offboarding Mutation Hooks|Offboarding Mutation Hooks]]
- [[_COMMUNITY_Feedback 360 Screen|Feedback 360 Screen]]
- [[_COMMUNITY_Subscription Detail Screen|Subscription Detail Screen]]
- [[_COMMUNITY_Disciplinary Screen|Disciplinary Screen]]
- [[_COMMUNITY_My Leave Screen|My Leave Screen]]
- [[_COMMUNITY_Notification Rule Screen|Notification Rule Screen]]
- [[_COMMUNITY_My Attendance Screen|My Attendance Screen]]
- [[_COMMUNITY_Reports Hub Screen|Reports Hub Screen]]
- [[_COMMUNITY_Payroll Report Screen|Payroll Report Screen]]
- [[_COMMUNITY_Chatbot Screen|Chatbot Screen]]
- [[_COMMUNITY_Loan Screen|Loan Screen]]
- [[_COMMUNITY_API Client|API Client]]
- [[_COMMUNITY_Onboarding Constants|Onboarding Constants]]
- [[_COMMUNITY_Upload View|Upload View]]
- [[_COMMUNITY_Safety Induction Page|Safety Induction Page]]
- [[_COMMUNITY_Overtime Request Dialog|Overtime Request Dialog]]
- [[_COMMUNITY_Probation Date Utils|Probation Date Utils]]
- [[_COMMUNITY_Push Notification Setup|Push Notification Setup]]
- [[_COMMUNITY_Login Screen|Login Screen]]
- [[_COMMUNITY_Onboarding Step 2|Onboarding Step 2]]
- [[_COMMUNITY_Socket Client|Socket Client]]
- [[_COMMUNITY_Tenant Detection|Tenant Detection]]
- [[_COMMUNITY_Onboarding Step 4|Onboarding Step 4]]
- [[_COMMUNITY_Visit Status Page|Visit Status Page]]
- [[_COMMUNITY_Notification Analytics|Notification Analytics]]
- [[_COMMUNITY_PNPM Workspace Config|PNPM Workspace Config]]

## God Nodes (most connected - your core abstractions)
1. `showApiError()` - 245 edges
2. `showSuccess()` - 241 edges
3. `navigate()` - 17 edges
4. `Mobile ERP PRD v2.0` - 15 edges
5. `update()` - 10 edges
6. `setField()` - 9 edges
7. `TeamViewScreen()` - 8 edges
8. `useFileUrl()` - 6 edges
9. `handleSubmit()` - 5 edges
10. `MyLoanScreen()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `PNPM Workspace Configuration` --conceptually_related_to--> `Electron Preload Script`  [INFERRED]
  pnpm-workspace.yaml → dist-electron/preload.mjs
- `Web App HTML Entry Point` --conceptually_related_to--> `Mobile ERP PRD v2.0`  [INFERRED]
  index.html → docs/Mobile_ERP_PRD_v2.html
- `startCamera()` --calls--> `showApiError()`  [INFERRED]
  src/features/company-admin/visitors/PreRegisterVisitorScreen.tsx → src/lib/toast.tsx
- `handleChange()` --calls--> `showApiError()`  [INFERRED]
  src/features/docdiff/components/UploadView.tsx → src/lib/toast.tsx
- `handleDownloadPdf()` --calls--> `showApiError()`  [INFERRED]
  src/features/docdiff/components/ReportView.tsx → src/lib/toast.tsx

## Communities

### Community 0 - "Company Admin Screens"
Cohesion: 0.01
Nodes (174): async(), closeEdit(), handleSave(), handleDelete(), handleSave(), handleDelete(), handleSave(), handleDelete() (+166 more)

### Community 1 - "Recruitment API"
Cohesion: 0.01
Nodes (2): markAttendance(), handleStatusChange()

### Community 2 - "ESS Query Hooks"
Cohesion: 0.03
Nodes (13): useCompanySettings(), useApplyForLoan(), useApproveRequest(), useRejectRequest(), useEssLoanPolicies(), useMyLoans(), usePendingMssApprovals(), useTeamAttendance() (+5 more)

### Community 5 - "Analytics Dashboard Screens"
Cohesion: 0.04
Nodes (22): handleDrilldown(), handleDrilldown(), handleDrilldown(), handleDrilldown(), handleDrilldown(), handleDrilldown(), handleDrilldown(), handleDrilldown() (+14 more)

### Community 6 - "File Upload & R2"
Cohesion: 0.04
Nodes (20): R2Image(), R2Link(), useFileUpload(), useFileUrl(), employeeName(), handleApprove(), handleDeleteCategory(), handleFileDrop() (+12 more)

### Community 7 - "Invoice Query Hooks"
Cohesion: 0.04
Nodes (20): useGenerateInvoice(), downloadCompanyTemplate(), useTenantList(), handleClose(), handleDone(), handleDownloadTemplate(), handleDrop(), handleFileChange() (+12 more)

### Community 11 - "HR Feature Screens"
Cohesion: 0.04
Nodes (15): handleSubmit(), handleCompute(), handleDelete(), handleMerge(), handleSave(), openEdit(), displayRef(), handleDeleteOffer() (+7 more)

### Community 13 - "ESS Expense Claims"
Cohesion: 0.06
Nodes (18): buildPayload(), EssReceiptThumbnail(), handleCreate(), handleUpdate(), isImageFile(), handleSave(), setField(), validate() (+10 more)

### Community 14 - "Auth API"
Cohesion: 0.05
Nodes (10): checkPermission(), decodeJwtPayload(), parsePermissionsFromAccessToken(), useCanPerform(), hydrateAuth(), isEmployeeUser(), mapBackendRole(), useHasPermission() (+2 more)

### Community 16 - "Company Admin Query Hooks"
Cohesion: 0.05
Nodes (7): useMyGoals(), useNavigationManifest(), MyGoalsScreen(), useNotificationSocket(), usePermissionRefresh(), useSessionTimeout(), DashboardLayout()

### Community 22 - "HR Query Hooks"
Cohesion: 0.07
Nodes (4): downloadBulkEmployeeTemplate(), handleClose(), handleDownloadTemplate(), resetState()

### Community 23 - "User Management Screen"
Cohesion: 0.08
Nodes (16): handleSave(), handleToggleStatus(), validateForm(), extractErrorMessage(), showError(), showWarning(), handleClose(), handleDownloadPdf() (+8 more)

### Community 28 - "Leave Policy Screen"
Cohesion: 0.09
Nodes (4): handleDelete(), handleSave(), handleDelete(), handleSave()

### Community 35 - "PRD & Entry Point"
Cohesion: 0.19
Nodes (19): Web App HTML Entry Point, Main TSX Entry Module, PRD Three Modules (HR Machine Visitor), Mobile ERP PRD v2.0, Finance Module, GST Compliance (CGST SGST IGST), Home Screen Dashboard, HR Management Module (+11 more)

### Community 37 - "My Profile Screen"
Cohesion: 0.12
Nodes (3): handleChangePassword(), handleMfaResetConfirm(), handleSaveProfile()

### Community 38 - "Succession Planning"
Cohesion: 0.14
Nodes (4): employeeName(), handleDelete(), handleSave(), successorName()

### Community 39 - "Designation Screen"
Cohesion: 0.18
Nodes (6): generateCode(), handleCodeChange(), handleDelete(), handleNameChange(), handleSave(), updateField()

### Community 40 - "Leave Balance Screen"
Cohesion: 0.19
Nodes (6): DetailRow(), employeeName(), formatLeaveNumber(), getTotals(), handleAdjust(), roundTo2()

### Community 41 - "Salary Structure Screen"
Cohesion: 0.14
Nodes (2): handleDelete(), handleSave()

### Community 45 - "Leave Request Screen"
Cohesion: 0.17
Nodes (5): employeeName(), handleApply(), handleApprove(), handleCancel(), handleReject()

### Community 46 - "Tax Config Screen"
Cohesion: 0.27
Nodes (11): addNewSlab(), addOldSlab(), addSurcharge(), handleSave(), removeNewSlab(), removeOldSlab(), removeSurcharge(), update() (+3 more)

### Community 49 - "Support Ticket Chat"
Cohesion: 0.18
Nodes (2): handleKeyDown(), handleSend()

### Community 50 - "Cost Centre Screen"
Cohesion: 0.21
Nodes (6): generateCode(), handleCodeChange(), handleDelete(), handleNameChange(), handleSave(), updateField()

### Community 53 - "Role Management Screen"
Cohesion: 0.22
Nodes (5): buildPermissions(), flattenPermissions(), handleDelete(), handleSave(), openEdit()

### Community 54 - "Visitor Pre-register"
Cohesion: 0.2
Nodes (4): capturePhoto(), handleSubmit(), startCamera(), stopCamera()

### Community 55 - "Department Screen"
Cohesion: 0.24
Nodes (6): generateCode(), handleCodeChange(), handleDelete(), handleNameChange(), handleSave(), updateField()

### Community 56 - "Payslip Screen"
Cohesion: 0.22
Nodes (3): handleEmail(), inr(), num()

### Community 57 - "Employee Salary Screen"
Cohesion: 0.2
Nodes (1): handleSave()

### Community 58 - "Offboarding Mutation Hooks"
Cohesion: 0.2
Nodes (2): useCreateExitRequest(), InitiateExitModal()

### Community 59 - "Feedback 360 Screen"
Cohesion: 0.2
Nodes (2): handleCreate(), handleSubmitFeedback()

### Community 64 - "Subscription Detail Screen"
Cohesion: 0.28
Nodes (4): AmcBadge(), amcStatusStyle(), statusConfig(), StatusPill()

### Community 65 - "Disciplinary Screen"
Cohesion: 0.22
Nodes (1): handleSave()

### Community 66 - "My Leave Screen"
Cohesion: 0.25
Nodes (3): computeDays(), handleApply(), handleCancelLeave()

### Community 68 - "Notification Rule Screen"
Cohesion: 0.22
Nodes (2): handleDelete(), handleSave()

### Community 69 - "My Attendance Screen"
Cohesion: 0.22
Nodes (1): handleRegularize()

### Community 70 - "Reports Hub Screen"
Cohesion: 0.25
Nodes (2): handleDownload(), handleRegenerate()

### Community 78 - "Payroll Report Screen"
Cohesion: 0.32
Nodes (3): formatCell(), formatCurrency(), formatPercent()

### Community 80 - "Chatbot Screen"
Cohesion: 0.29
Nodes (2): handleKeyDown(), handleSend()

### Community 81 - "Loan Screen"
Cohesion: 0.25
Nodes (2): handleCreate(), handleStatusChange()

### Community 97 - "API Client"
Cohesion: 0.43
Nodes (4): getStoredAccessToken(), getStoredRefreshToken(), isTokenExpiringSoon(), proactiveRefreshIfNeeded()

### Community 101 - "Onboarding Constants"
Cohesion: 0.33
Nodes (3): Step09PerLocationModules(), Step10PerLocationTier(), resolveModuleDependencies()

### Community 119 - "Upload View"
Cohesion: 0.5
Nodes (2): handleChange(), validateFile()

### Community 126 - "Safety Induction Page"
Cohesion: 0.5
Nodes (2): handleQuestionnaireSubmit(), handleSubmitInduction()

### Community 129 - "Overtime Request Dialog"
Cohesion: 0.5
Nodes (2): handleClose(), resetForm()

### Community 137 - "Probation Date Utils"
Cohesion: 0.7
Nodes (4): addCalendarDaysToIsoDate(), addCalendarMonthsToIsoDate(), computeProbationEndIsoFromMasters(), getProbationDaysFromDesignation()

### Community 139 - "Push Notification Setup"
Cohesion: 0.5
Nodes (2): initWebPushNotifications(), waitForActiveWorker()

### Community 143 - "Login Screen"
Cohesion: 0.67
Nodes (2): MetricCounter(), useCountUp()

### Community 145 - "Onboarding Step 2"
Cohesion: 0.67
Nodes (2): NoSeriesItemCard(), parseIntOrDefault()

### Community 158 - "Socket Client"
Cohesion: 0.67
Nodes (2): connectSocket(), getSocket()

### Community 159 - "Tenant Detection"
Cohesion: 0.67
Nodes (2): detectTenant(), getTenantContext()

### Community 169 - "Onboarding Step 4"
Cohesion: 1.0
Nodes (2): buildSchema(), Step02Statutory()

### Community 171 - "Visit Status Page"
Cohesion: 1.0
Nodes (2): getStatusConfig(), VisitStatusPage()

### Community 174 - "Notification Analytics"
Cohesion: 1.0
Nodes (2): notificationAnalyticsKey(), useNotificationAnalytics()

### Community 188 - "PNPM Workspace Config"
Cohesion: 0.67
Nodes (3): PNPM Workspace Configuration, Electron Preload Script, IPC Renderer Context Bridge

## Knowledge Gaps
- **6 isolated node(s):** `Main TSX Entry Module`, `PNPM Workspace Configuration`, `IPC Renderer Context Bridge`, `Home Screen Dashboard`, `User Roles and Permissions` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Recruitment API`** (138 nodes): `addProgramCourse()`, `advanceCandidateStage()`, `approveExpenseClaim()`, `bulkMarkAttendance()`, `cancelInterview()`, `completeInterview()`, `convertCandidateToEmployee()`, `createAsset()`, `createAssetAssignment()`, `createAssetCategory()`, `createCandidate()`, `createCandidateDocument()`, `createCandidateEducation()`, `createCandidateExperience()`, `createDisciplinaryAction()`, `createExpenseCategory()`, `createExpenseClaim()`, `createGrievanceCase()`, `createGrievanceCategory()`, `createInterview()`, `createLetter()`, `createLetterTemplate()`, `createOffer()`, `createRequisition()`, `createTrainer()`, `createTrainingBudget()`, `createTrainingCatalogue()`, `createTrainingMaterial()`, `createTrainingNomination()`, `createTrainingProgram()`, `createTrainingSession()`, `deleteAssetCategory()`, `deleteCandidate()`, `deleteCandidateDocument()`, `deleteCandidateEducation()`, `deleteCandidateExperience()`, `deleteExpenseCategory()`, `deleteExpenseClaim()`, `deleteGrievanceCategory()`, `deleteLetterTemplate()`, `deleteOffer()`, `deleteRequisition()`, `deleteTrainer()`, `deleteTrainingCatalogue()`, `deleteTrainingMaterial()`, `deleteTrainingProgram()`, `deleteTrainingSession()`, `dispatchESign()`, `enrollInProgram()`, `generateLetterPdf()`, `getAsset()`, `getAssetCategory()`, `getBudgetUtilization()`, `getCandidate()`, `getDisciplinaryAction()`, `getESignStatus()`, `getExpenseCategory()`, `getExpenseClaim()`, `getExpiringCertificates()`, `getGrievanceCase()`, `getGrievanceCategory()`, `getInterview()`, `getLetter()`, `getLetterTemplate()`, `getOffer()`, `getRecruitmentDashboard()`, `getRequisition()`, `getTrainer()`, `getTrainingCatalogue()`, `getTrainingDashboard()`, `getTrainingEvaluation()`, `getTrainingEvaluationSummary()`, `getTrainingProgram()`, `getTrainingSession()`, `listAssetAssignments()`, `listAssetCategories()`, `listAssets()`, `listCandidateDocuments()`, `listCandidateEducation()`, `listCandidateExperience()`, `listCandidates()`, `listDisciplinaryActions()`, `listExpenseCategories()`, `listExpenseClaims()`, `listGrievanceCases()`, `listGrievanceCategories()`, `listInterviewEvaluations()`, `listInterviews()`, `listLetters()`, `listLetterTemplates()`, `listOffers()`, `listPendingESign()`, `listProgramEnrollments()`, `listRequisitions()`, `listSessionAttendance()`, `listSessionEvaluations()`, `listTrainers()`, `listTrainingBudgets()`, `listTrainingCatalogue()`, `listTrainingMaterials()`, `listTrainingNominations()`, `listTrainingPrograms()`, `listTrainingSessions()`, `markAttendance()`, `registerSessionAttendees()`, `rejectExpenseClaim()`, `removeProgramCourse()`, `submitEssFeedback()`, `submitExpenseClaim()`, `submitInterviewEvaluations()`, `submitTrainingEvaluation()`, `updateAsset()`, `updateAssetAssignment()`, `updateAssetCategory()`, `updateCandidate()`, `updateCandidateEducation()`, `updateCandidateExperience()`, `updateDisciplinaryAction()`, `updateExpenseCategory()`, `updateExpenseClaim()`, `updateGrievanceCase()`, `updateGrievanceCategory()`, `updateInterview()`, `updateLetterTemplate()`, `updateOffer()`, `updateOfferStatus()`, `updateRequisition()`, `updateTrainer()`, `updateTrainingBudget()`, `updateTrainingCatalogue()`, `updateTrainingMaterial()`, `updateTrainingNomination()`, `updateTrainingProgram()`, `updateTrainingSession()`, `updateTrainingSessionStatus()`, `handleStatusChange()`, `recruitment.ts`, `AttendanceTrack.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Salary Structure Screen`** (14 nodes): `addComponentRow()`, `computePreview()`, `FormField()`, `getComponentName()`, `handleAllClick()`, `handleDelete()`, `handleSave()`, `openCreate()`, `openEdit()`, `removeComponentRow()`, `toggle()`, `updateComponentRow()`, `updateField()`, `SalaryStructureScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Support Ticket Chat`** (12 nodes): `TicketChatScreen.tsx`, `CategoryChip()`, `cn()`, `formatDateSeparator()`, `formatTime()`, `handleClose()`, `handleKeyDown()`, `handleSend()`, `isOwnMessage()`, `isSameSenderGroup()`, `shouldShowDateSeparator()`, `StatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Employee Salary Screen`** (10 nodes): `FormField()`, `getEmployeeCode()`, `getEmployeeName()`, `getStructureName()`, `handleSave()`, `NumberField()`, `openCreate()`, `openEdit()`, `updateField()`, `EmployeeSalaryScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Offboarding Mutation Hooks`** (10 nodes): `useApproveFnF()`, `useComputeFnF()`, `useCreateExitInterview()`, `useCreateExitRequest()`, `usePayFnF()`, `useUpdateClearance()`, `useUpdateExitRequest()`, `InitiateExitModal()`, `use-offboarding-mutations.ts`, `ExitRequestScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Feedback 360 Screen`** (10 nodes): `employeeName()`, `handleCreate()`, `handleSubmitFeedback()`, `openCreate()`, `openReport()`, `openSubmit()`, `toggleRater()`, `updateField()`, `updateSubmitField()`, `Feedback360Screen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Disciplinary Screen`** (9 nodes): `ActionStatusBadge()`, `employeeName()`, `formatDate()`, `formatEnumValue()`, `handleSave()`, `openCreate()`, `openEdit()`, `updateField()`, `DisciplinaryScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Notification Rule Screen`** (9 nodes): `ChannelBadge()`, `eventLabel()`, `handleDelete()`, `handleSave()`, `openCreate()`, `openEdit()`, `roleLabel()`, `templateName()`, `NotificationRuleScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `My Attendance Screen`** (9 nodes): `formatTime()`, `getDaysInMonth()`, `getFirstDayOfMonth()`, `handleRegularize()`, `nextMonth()`, `openRegularize()`, `PremiumCard()`, `prevMonth()`, `MyAttendanceScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reports Hub Screen`** (9 nodes): `getCurrentMonth()`, `getCurrentYear()`, `getFirstDayOfMonth()`, `getLastDayOfMonth()`, `handleDownload()`, `handleRegenerate()`, `SkeletonCard()`, `summarizeFilters()`, `ReportsHubScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chatbot Screen`** (8 nodes): `extractChatMessageRows()`, `handleEscalate()`, `handleKeyDown()`, `handleQuickAction()`, `handleSend()`, `parseRow()`, `scrollToBottom()`, `ChatbotScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Loan Screen`** (8 nodes): `handleCreate()`, `handleStatusChange()`, `loanEmployeeCode()`, `loanPolicyName()`, `NumberField()`, `openCreate()`, `updateField()`, `LoanScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Upload View`** (5 nodes): `handleChange()`, `handleModelChange()`, `handleSubmit()`, `validateFile()`, `UploadView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Safety Induction Page`** (5 nodes): `SafetyInductionPage.tsx`, `formatTime()`, `handleQuestionnaireSubmit()`, `handleSubmitInduction()`, `startVideoTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Overtime Request Dialog`** (5 nodes): `handleClose()`, `handleSubmit()`, `removeAttachment()`, `resetForm()`, `ClaimOvertimeDialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Push Notification Setup`** (5 nodes): `getFcmToken()`, `initWebPushNotifications()`, `unregisterWebPush()`, `waitForActiveWorker()`, `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login Screen`** (4 nodes): `MetricCounter()`, `onSubmit()`, `useCountUp()`, `LoginScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Step 2`** (4 nodes): `Step13NoSeries.tsx`, `NoSeriesItemCard()`, `onSubmit()`, `parseIntOrDefault()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Socket Client`** (4 nodes): `connectSocket()`, `disconnectSocket()`, `getSocket()`, `socket.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tenant Detection`** (4 nodes): `detectTenant()`, `getLoginPath()`, `getTenantContext()`, `tenant.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Step 4`** (3 nodes): `Step02Statutory.tsx`, `buildSchema()`, `Step02Statutory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Visit Status Page`** (3 nodes): `VisitStatusPage.tsx`, `getStatusConfig()`, `VisitStatusPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Notification Analytics`** (3 nodes): `notificationAnalyticsKey()`, `useNotificationAnalytics()`, `NotificationAnalyticsScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `showSuccess()` connect `Company Admin Screens` to `Analytics Dashboard Screens`, `File Upload & R2`, `Invoice Query Hooks`, `HR Feature Screens`, `ESS Expense Claims`, `HR Query Hooks`, `User Management Screen`, `Leave Policy Screen`, `My Profile Screen`, `Succession Planning`, `Designation Screen`, `Leave Balance Screen`, `Salary Structure Screen`, `Leave Request Screen`, `Tax Config Screen`, `Cost Centre Screen`, `Role Management Screen`, `Visitor Pre-register`, `Department Screen`, `Payslip Screen`, `Employee Salary Screen`, `Feedback 360 Screen`, `Disciplinary Screen`, `My Leave Screen`, `Notification Rule Screen`, `My Attendance Screen`, `Reports Hub Screen`, `Loan Screen`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `showApiError()` connect `Company Admin Screens` to `Analytics Dashboard Screens`, `File Upload & R2`, `Invoice Query Hooks`, `HR Feature Screens`, `HR Query Hooks`, `User Management Screen`, `Leave Policy Screen`, `My Profile Screen`, `Succession Planning`, `Designation Screen`, `Leave Balance Screen`, `Salary Structure Screen`, `Leave Request Screen`, `Tax Config Screen`, `Cost Centre Screen`, `Role Management Screen`, `Visitor Pre-register`, `Department Screen`, `Payslip Screen`, `Employee Salary Screen`, `Feedback 360 Screen`, `Disciplinary Screen`, `My Leave Screen`, `Notification Rule Screen`, `My Attendance Screen`, `Reports Hub Screen`, `Loan Screen`, `Upload View`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `handleSave()` connect `Analytics Dashboard Screens` to `Company Admin Screens`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 243 inferred relationships involving `showApiError()` (e.g. with `handleChange()` and `handleDownloadPdf()`) actually correct?**
  _`showApiError()` has 243 INFERRED edges - model-reasoned connections that need verification._
- **Are the 240 inferred relationships involving `showSuccess()` (e.g. with `handleSubmit()` and `handleSendEmail()`) actually correct?**
  _`showSuccess()` has 240 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `navigate()` (e.g. with `handleAddModule()` and `handleRemoveModule()`) actually correct?**
  _`navigate()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Mobile ERP PRD v2.0` (e.g. with `Mobile ERP Interactive Prototype` and `PRD Three Modules (HR Machine Visitor)`) actually correct?**
  _`Mobile ERP PRD v2.0` has 3 INFERRED edges - model-reasoned connections that need verification._