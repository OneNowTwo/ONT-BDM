/**
 * Set by POST /api/runs/cancel — checked between research queries, enrich,
 * qualify, and draft iterations so a run can stop without restarting the server.
 */
function requestPipelineCancel() {
  global.pipelineCancelRequested = true;
}

function clearPipelineCancel() {
  global.pipelineCancelRequested = false;
}

function isPipelineCancelRequested() {
  return !!global.pipelineCancelRequested;
}

module.exports = {
  requestPipelineCancel,
  clearPipelineCancel,
  isPipelineCancelRequested,
};
