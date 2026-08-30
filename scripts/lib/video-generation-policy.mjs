const ALLOWED_MODELS = new Set(['seedance-2.0', 'seedance-2.5']);

export function validateVideoProposal(proposal) {
  const errors = [];
  if (!proposal.goal) errors.push('goal is required');
  if (!ALLOWED_MODELS.has(proposal.model)) errors.push('model must be seedance-2.0 or seedance-2.5');
  if (proposal.output_count !== 1) errors.push('exactly one output is allowed per approval');
  if (!proposal.duration) errors.push('duration is required');
  if (!proposal.aspect_ratio) errors.push('aspect ratio is required');
  if (!proposal.resolution) errors.push('resolution is required');
  if (!Array.isArray(proposal.motion_constraints) || !proposal.motion_constraints.length) errors.push('motion constraints are required');
  if (!Array.isArray(proposal.avoid) || !proposal.avoid.length) errors.push('avoid list is required');
  return errors;
}

export function assertSubmissionAllowed(proposal, approval) {
  const errors = validateVideoProposal(proposal);
  if (errors.length) throw new Error(errors.join('; '));
  if (!approval?.explicit_user_confirmation) throw new Error('Explicit user confirmation is required before submission.');
  if (approval.proposal_id !== proposal.id) throw new Error('Approval does not match this proposal.');
  if (approval.consumed_at) throw new Error('This approval has already authorized one submission.');
  if (proposal.status !== 'approved-for-one-submission') throw new Error('Proposal is not approved for submission.');
  return true;
}
