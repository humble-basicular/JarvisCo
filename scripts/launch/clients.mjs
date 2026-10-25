// Public identities only. Configs/receipts remain in the existing private Drive folders.
export const acceptedFrontend = 'ba0d439acf61d138c5cb74626272ab3500eb9a2d';
export const clients = [
  ['meselektra', 'meselektra-re307', 'cg6j485ktf', '2198c0eb-a05f-4136-9976-6a6f6f2cbdd2', 'launch-2026-10-24/launch-config.json'],
  ['laikam', 'laikam-ls671', 'ejgb7a33zs', '52dc7843-c3f0-4fb9-949e-1f4c101ea12d', 'launch-2026-10-24/launch-config.json'],
  ['masaukstalipiai', 'masaukstalipiai', 'cfa9bwee8q', 'a9fb93be-a7b9-44c8-a46e-d316507c2563', 'launch/launch-config.json'],
  ['vensland', 'vensland', 'aewz4kawy3', '0438afc6-4e87-4964-b21b-c30d5d3d6c68', 'launch/launch-config.draft-unverified.json'],
].map(([site, folder, slug, projectId, config]) => ({ site, folder, slug, projectId, config,
  domain: `${site}.lt`, project: `jarvisweb-${site}` }));

// None are inferred from a successful build or from another gate.
export const gateNames = [
  'paymentOrExistingDomain', 'registrantAndDomainControl', 'dnsMailBackupAndAccess',
  'privacyAndRecipientsApproved', 'workerLiveRegistration', 'destinationsVerified',
  'deploymentAndTls', 'mailPreserved', 'inquiryAndBothInboxReceipts',
  'interlinksAndSearchConsole', 'clientWorkingLaunchApproval', 'ownerLaunchConfirmation',
  'gbpClientOwnershipAndManagerAccess', 'gbpWebsiteLinked', 'gbpExternalVerification',
];
