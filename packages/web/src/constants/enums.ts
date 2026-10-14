export enum StageId {
  NewLead = 'new_lead',
  Contacted = 'contacted',
  DemoDone = 'demo_done',
  ProposalSent = 'proposal_sent',
  Negotiation = 'negotiation',
  Won = 'won',
  Lost = 'lost',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum SkipReason {
  AlreadyInStage = 'already_in_stage',
  InvalidTransition = 'invalid_transition',
  Busy = 'busy',
}

export enum SaveStatus {
  Saving = 'saving',
  Failed = 'failed',
  Conflict = 'conflict',
  Rejected = 'rejected',
}

export enum ApiErrorKind {
  Network = 'network',
  Offline = 'offline',
  Server = 'server',
}

export enum ItemErrorKind {
  Validation = 'validation',
  Conflict = 'conflict',
  NotFound = 'not_found',
}

export enum InjectedFailure {
  RequestLost = 'request_lost',
  ResponseLost = 'response_lost',
  ServerError = 'server_error',
}
