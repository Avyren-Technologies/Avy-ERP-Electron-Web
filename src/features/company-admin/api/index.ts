export {
    companyAdminKeys,
    useCompanyProfile,
    useCompanyLocations,
    useCompanyLocation,
    useCompanyShifts,
    useCompanyContacts,
    useCompanyNoSeries,
    useCompanyIOTReasons,
    useCompanyControls,
    useCompanySettings,
    useCompanyUsers,
    useCompanyUser,
    useCompanyAuditLogs,
    useCompanyActivity,
    useRbacRoles,
    useNavigationManifest,
} from './use-company-admin-queries';

export {
    useUpdateProfileSection,
    useUpdateLocation,
    useDeleteLocation,
    useCreateShift,
    useUpdateShift,
    useDeleteShift,
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
    useCreateNoSeries,
    useUpdateNoSeries,
    useDeleteNoSeries,
    useCreateIOTReason,
    useUpdateIOTReason,
    useDeleteIOTReason,
    useUpdateControls,
    useUpdateSettings,
    useCreateUser,
    useUpdateUser,
    useUpdateUserStatus,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
} from './use-company-admin-mutations';

export {
    hrKeys,
    useDepartments,
    useDepartment,
    useDesignations,
    useDesignation,
    useGrades,
    useGrade,
    useEmployeeTypes,
    useEmployeeType,
    useCostCentres,
    useCostCentre,
    useEmployees,
    useEmployee,
    useEmployeeNominees,
    useEmployeeEducation,
    useEmployeePreviousEmployment,
    useEmployeeDocuments,
    useEmployeeTimeline,
    useProbationDue,
    useOrgChart,
} from './use-hr-queries';

export {
    useCreateDepartment,
    useUpdateDepartment,
    useDeleteDepartment,
    useCreateDesignation,
    useUpdateDesignation,
    useDeleteDesignation,
    useCreateGrade,
    useUpdateGrade,
    useDeleteGrade,
    useCreateEmployeeType,
    useUpdateEmployeeType,
    useDeleteEmployeeType,
    useCreateCostCentre,
    useUpdateCostCentre,
    useDeleteCostCentre,
    useCreateEmployee,
    useUpdateEmployee,
    useDeleteEmployee,
    useUpdateEmployeeStatus,
    useCreateNominee,
    useUpdateNominee,
    useDeleteNominee,
    useCreateEducation,
    useUpdateEducation,
    useDeleteEducation,
    useCreatePreviousEmployment,
    useUpdatePreviousEmployment,
    useDeletePreviousEmployment,
    useCreateDocument,
    useUpdateDocument,
    useDeleteDocument,
    useSubmitProbationReview,
} from './use-hr-mutations';

// Attendance
export {
    attendanceKeys,
    useAttendanceRecords,
    useAttendanceRecord,
    useAttendanceSummary,
    useAttendanceRules,
    useAttendanceOverrides,
    useHolidays,
    useRosters,
    useOvertimeRules,
} from './use-attendance-queries';

export {
    useCreateAttendanceRecord,
    useUpdateAttendanceRecord,
    useUpdateAttendanceRules,
    useCreateAttendanceOverride,
    useUpdateAttendanceOverride,
    useCreateHoliday,
    useUpdateHoliday,
    useDeleteHoliday,
    useCloneHolidays,
    useCreateRoster,
    useUpdateRoster,
    useDeleteRoster,
    useUpdateOvertimeRules,
} from './use-attendance-mutations';

// Leave Management
export {
    leaveKeys,
    useLeaveTypes,
    useLeaveType,
    useLeavePolicies,
    useLeaveBalances,
    useLeaveRequests,
    useLeaveRequest,
    useLeaveSummary,
} from './use-leave-queries';

export {
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeleteLeaveType,
    useCreateLeavePolicy,
    useUpdateLeavePolicy,
    useDeleteLeavePolicy,
    useAdjustLeaveBalance,
    useInitializeLeaveBalances,
    useCreateLeaveRequest,
    useApproveLeaveRequest,
    useRejectLeaveRequest,
    useCancelLeaveRequest,
} from './use-leave-mutations';

// Payroll & Compliance
export {
    payrollKeys,
    useSalaryComponents,
    useSalaryComponent,
    useSalaryStructures,
    useSalaryStructure,
    useEmployeeSalaries,
    useEmployeeSalary,
    usePFConfig,
    useESIConfig,
    usePTConfigs,
    useGratuityConfig,
    useBonusConfig,
    useLWFConfigs,
    useBankConfig,
    useLoanPolicies,
    useLoanPolicy,
    useLoans,
    useTaxConfig,
    useTravelAdvances,
} from './use-payroll-queries';

export {
    useCreateSalaryComponent,
    useUpdateSalaryComponent,
    useDeleteSalaryComponent,
    useCreateSalaryStructure,
    useUpdateSalaryStructure,
    useDeleteSalaryStructure,
    useAssignEmployeeSalary,
    useUpdateEmployeeSalary,
    useUpdatePFConfig,
    useUpdateESIConfig,
    useCreatePTConfig,
    useUpdatePTConfig,
    useDeletePTConfig,
    useUpdateGratuityConfig,
    useUpdateBonusConfig,
    useCreateLWFConfig,
    useUpdateLWFConfig,
    useDeleteLWFConfig,
    useUpdateBankConfig,
    useCreateLoanPolicy,
    useUpdateLoanPolicy,
    useDeleteLoanPolicy,
    useCreateLoan,
    useUpdateLoan,
    useUpdateLoanStatus,
    useUpdateTaxConfig,
    useCreateTravelAdvance,
    useSettleTravelAdvance,
} from './use-payroll-mutations';

// Payroll Operations (Runs, Payslips, Holds, Revisions, Statutory, Reports)
export {
    payrollRunKeys,
    usePayrollRuns,
    usePayrollRun,
    usePayrollEntries,
    usePayrollEntry,
    usePayslips,
    usePayslip,
    useSalaryHolds,
    useSalaryRevisions,
    useSalaryRevision,
    useArrearEntries,
    useStatutoryFilings,
    useStatutoryDashboard,
    useSalaryRegister,
    useBankFile,
    usePFECR,
    useESIChallan,
    usePTChallan,
    useVarianceReport,
} from './use-payroll-run-queries';

// Form 16 / 24Q are mutation-only (no queries needed)

export {
    useCreatePayrollRun,
    useLockAttendance,
    useReviewExceptions,
    useComputeSalaries,
    useComputeStatutory,
    useApproveRun,
    useDisburseRun,
    useOverridePayrollEntry,
    useEmailPayslip,
    useGeneratePayslips,
    useCreateSalaryHold,
    useReleaseSalaryHold,
    useCreateSalaryRevision,
    useApproveSalaryRevision,
    useApplySalaryRevision,
    useCreateStatutoryFiling,
    useUpdateStatutoryFiling,
    useGenerateForm16,
    useGenerateForm24Q,
    useBulkEmailForm16,
} from './use-payroll-run-mutations';

// ESS & Workflows
export {
    essKeys,
    useEssConfig,
    useApprovalWorkflows,
    useApprovalWorkflow,
    useApprovalRequests,
    useApprovalRequest,
    usePendingApprovals,
    useNotificationTemplates,
    useNotificationRules,
    useITDeclarations,
    useITDeclaration,
    useMyProfile,
    useMyPayslips,
    useMyLeaveBalance,
    useMyAttendance,
    useMyDeclarations,
    useTeamMembers,
    usePendingMssApprovals,
    useTeamAttendance,
    useTeamLeaveCalendar,
    useMyShiftSwaps,
    useMyWfhRequests,
    useMyDocuments,
    usePolicyDocuments,
} from './use-ess-queries';

export {
    useUpdateEssConfig,
    useCreateApprovalWorkflow,
    useUpdateApprovalWorkflow,
    useDeleteApprovalWorkflow,
    useApproveRequest,
    useRejectRequest,
    useCreateNotificationTemplate,
    useUpdateNotificationTemplate,
    useDeleteNotificationTemplate,
    useCreateNotificationRule,
    useUpdateNotificationRule,
    useDeleteNotificationRule,
    useCreateITDeclaration,
    useUpdateITDeclaration,
    useSubmitITDeclaration,
    useVerifyITDeclaration,
    useLockITDeclaration,
    useApplyLeave,
    useRegularizeAttendance,
    useCreateShiftSwap,
    useCancelShiftSwap,
    useCreateWfhRequest,
    useCancelWfhRequest,
    useUploadMyDocument,
} from './use-ess-mutations';

// Performance Management
export {
    performanceKeys,
    useAppraisalCycles,
    useAppraisalCycle,
    useGoals,
    useGoal,
    useDepartmentGoals,
    useAppraisalEntries,
    useAppraisalEntry,
    useCalibrationData,
    useFeedback360List,
    useFeedback360,
    useFeedback360Report,
    useSkills,
    useSkill,
    useSkillMappings,
    useSkillGapAnalysis,
    useSuccessionPlans,
    useSuccessionPlan,
    useNineBoxData,
    useBenchStrength,
    usePerformanceDashboard,
} from './use-performance-queries';

export {
    useCreateAppraisalCycle,
    useUpdateAppraisalCycle,
    useDeleteAppraisalCycle,
    useActivateAppraisalCycle,
    usePublishAppraisalCycle,
    useCloseAppraisalCycle,
    useCreateGoal,
    useUpdateGoal,
    useDeleteGoal,
    useUpdateAppraisalEntry,
    useSubmitSelfReview,
    useSubmitManagerReview,
    usePublishAppraisalEntry,
    useCreateFeedback360,
    useUpdateFeedback360,
    useCreateSkill,
    useUpdateSkill,
    useDeleteSkill,
    useCreateSkillMapping,
    useUpdateSkillMapping,
    useDeleteSkillMapping,
    useCreateSuccessionPlan,
    useUpdateSuccessionPlan,
    useDeleteSuccessionPlan,
} from './use-performance-mutations';

// Recruitment, Training & Advanced HR
export {
    recruitmentKeys,
    useRequisitions,
    useRequisition,
    useCandidates,
    useCandidate,
    useInterviews,
    useInterview,
    useRecruitmentDashboard,
    useTrainingCatalogue,
    useTrainingCatalogueItem,
    useTrainingNominations,
    useTrainingDashboard,
    useAssetCategories,
    useAssetCategory,
    useAssets,
    useAsset,
    useAssetAssignments,
    useExpenseClaims,
    useExpenseClaim,
    useLetterTemplates,
    useLetterTemplate,
    useLetters,
    useLetter,
    useGrievanceCategories,
    useGrievanceCategory,
    useGrievanceCases,
    useGrievanceCase,
    useDisciplinaryActions,
    useDisciplinaryAction,
    useESignStatus,
    usePendingESign,
} from './use-recruitment-queries';

export {
    useCreateRequisition,
    useUpdateRequisition,
    useDeleteRequisition,
    useCreateCandidate,
    useUpdateCandidate,
    useCreateInterview,
    useUpdateInterview,
    useCreateTrainingCatalogue,
    useUpdateTrainingCatalogue,
    useDeleteTrainingCatalogue,
    useCreateTrainingNomination,
    useUpdateTrainingNomination,
    useCreateAssetCategory,
    useUpdateAssetCategory,
    useDeleteAssetCategory,
    useCreateAsset,
    useUpdateAsset,
    useCreateAssetAssignment,
    useUpdateAssetAssignment,
    useCreateExpenseClaim,
    useUpdateExpenseClaim,
    useApproveExpenseClaim,
    useRejectExpenseClaim,
    useCreateLetterTemplate,
    useUpdateLetterTemplate,
    useDeleteLetterTemplate,
    useCreateLetter,
    useGenerateLetterPdf,
    useCreateGrievanceCategory,
    useUpdateGrievanceCategory,
    useDeleteGrievanceCategory,
    useCreateGrievanceCase,
    useUpdateGrievanceCase,
    useCreateDisciplinaryAction,
    useUpdateDisciplinaryAction,
    useDispatchESign,
} from './use-recruitment-mutations';

// Offboarding (Exit & Separation)
export {
    offboardingKeys,
    useExitRequests,
    useExitRequest,
    useExitClearances,
    useExitInterview,
    useFnFSettlements,
    useFnFSettlement,
} from './use-offboarding-queries';

export {
    useCreateExitRequest,
    useUpdateExitRequest,
    useUpdateClearance,
    useCreateExitInterview,
    useComputeFnF,
    useApproveFnF,
    usePayFnF,
} from './use-offboarding-mutations';

// Transfer, Promotion & Delegation
export {
    transferKeys,
    useTransfers,
    useTransfer,
    usePromotions,
    usePromotion,
    useDelegates,
} from './use-transfer-queries';

export {
    useCreateTransfer,
    useApproveTransfer,
    useApplyTransfer,
    useRejectTransfer,
    useCancelTransfer,
    useCreatePromotion,
    useApprovePromotion,
    useApplyPromotion,
    useRejectPromotion,
    useCancelPromotion,
    useCreateDelegate,
    useRevokeDelegate,
} from './use-transfer-mutations';

// Support & Module CRUD
export {
    useSupportTickets,
    useSupportTicket,
    useMyGoals,
    useMyGrievances,
    useMyTraining,
    useMyAssets,
    useMyForm16,
} from './use-company-admin-queries';

export {
    useCreateSupportTicket,
    useSendSupportMessage,
    useCloseSupportTicket,
    useAddLocationModules,
    useRemoveLocationModule,
    useFileGrievance,
} from './use-company-admin-mutations';

// Onboarding
export {
    onboardingKeys,
    useOnboardingTemplates,
    useOnboardingTemplate,
    useOnboardingTasks,
    useOnboardingProgress,
} from './use-onboarding-queries';

export {
    useCreateOnboardingTemplate,
    useUpdateOnboardingTemplate,
    useDeleteOnboardingTemplate,
    useGenerateOnboardingTasks,
    useUpdateOnboardingTask,
} from './use-onboarding-mutations';

// Chatbot
export {
    chatbotKeys,
    useChatbotConversations,
    useChatbotConversation,
    useChatbotMessages,
} from './use-chatbot-queries';

export {
    useCreateChatbotConversation,
    useSendChatbotMessage,
    useEscalateChatbotConversation,
    useCloseChatbotConversation,
} from './use-chatbot-mutations';

// Retention / GDPR
export {
    retentionKeys,
    useRetentionPolicies,
    useRetentionDataRequests,
    useRetentionDataExport,
    useRetentionConsents,
    useRetentionCheckDue,
} from './use-retention-queries';

export {
    useCreateRetentionPolicy,
    useDeleteRetentionPolicy,
    useCreateRetentionDataRequest,
    useUpdateRetentionDataRequest,
    useAnonymiseEmployee,
    useCreateRetentionConsent,
} from './use-retention-mutations';

// Biometric Devices
export {
    biometricKeys,
    useBiometricDevices,
    useBiometricDevice,
} from './use-biometric-queries';

export {
    useCreateBiometricDevice,
    useUpdateBiometricDevice,
    useDeleteBiometricDevice,
    useTestBiometricDevice,
    useSyncBiometricDevice,
} from './use-biometric-mutations';

// Shift Rotations
export {
    shiftRotationKeys,
    useShiftRotations,
    useShiftRotation,
} from './use-shift-rotation-queries';

export {
    useCreateShiftRotation,
    useUpdateShiftRotation,
    useDeleteShiftRotation,
    useAssignShiftRotation,
    useUnassignShiftRotation,
    useExecuteShiftRotations,
} from './use-shift-rotation-mutations';

// Production Incentives
export {
    productionIncentiveKeys,
    useProductionIncentiveConfigs,
    useProductionIncentiveConfig,
    useProductionIncentiveRecords,
} from './use-production-incentive-queries';

export {
    useCreateProductionIncentiveConfig,
    useUpdateProductionIncentiveConfig,
    useDeleteProductionIncentiveConfig,
    useComputeProductionIncentive,
    useMergeProductionIncentive,
} from './use-production-incentive-mutations';

// Bonus Batches
export {
    bonusBatchKeys,
    useBonusBatches,
    useBonusBatch,
} from './use-bonus-batch-queries';

export {
    useCreateBonusBatch,
    useApproveBonusBatch,
    useMergeBonusBatch,
} from './use-bonus-batch-mutations';
