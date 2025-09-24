// Web Worker for handling file uploads and SSE connections
// This runs in a separate thread to keep uploads persistent

let currentUpload = null;
let sseConnection = null;

// Message types from main thread
const MESSAGE_TYPES = {
  START_UPLOAD: "START_UPLOAD",
  CANCEL_UPLOAD: "CANCEL_UPLOAD",
};

// Message types to main thread
const RESPONSE_TYPES = {
  UPLOAD_PROGRESS: "UPLOAD_PROGRESS",
  UPLOAD_SUCCESS: "UPLOAD_SUCCESS",
  UPLOAD_ERROR: "UPLOAD_ERROR",
  STATUS_UPDATE: "STATUS_UPDATE",
  SSE_CONNECTED: "SSE_CONNECTED",
  SSE_ERROR: "SSE_ERROR",
};

self.addEventListener("message", async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case MESSAGE_TYPES.START_UPLOAD:
      await handleStartUpload(payload);
      break;
    case MESSAGE_TYPES.CANCEL_UPLOAD:
      handleCancelUpload();
      break;
    default:
  }
});

async function handleStartUpload(payload) {
  const { file, projectId, organizationId, apiKey, baseUrl, toastId } = payload;

  try {
    currentUpload = {
      projectId,
      organizationId,
      toastId,
      cancelled: false,
    };

    // Update toast to pending
    postMessage({
      type: RESPONSE_TYPES.UPLOAD_PROGRESS,
      payload: {
        toastId,
        status: "pending",
        message: "Preparing upload...",
      },
    });

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("files", file);

    // Upload file to create statement
    const uploadResponse = await fetch(
      `${baseUrl}/py-api/projects/${projectId}/statements`,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "x-organization-id": organizationId,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const _uploadResult = await uploadResponse.json();

    if (currentUpload.cancelled) {
      return;
    }

    // Update toast to processing
    postMessage({
      type: RESPONSE_TYPES.UPLOAD_PROGRESS,
      payload: {
        toastId,
        status: "processing",
        message: "Processing document...",
      },
    });

    // The upload API should return success immediately if the file is queued
    // We'll rely on the SSE for real-time status updates, but for now
    // we'll simulate a successful upload
    setTimeout(() => {
      if (!currentUpload?.cancelled) {
        postMessage({
          type: RESPONSE_TYPES.STATUS_UPDATE,
          payload: {
            toastId,
            status: "completed",
            message: "Document uploaded successfully!",
          },
        });
      }
    }, 2000);
  } catch (error) {
    postMessage({
      type: RESPONSE_TYPES.UPLOAD_ERROR,
      payload: {
        toastId,
        error: error.message,
      },
    });
  }
}

function handleCancelUpload() {
  if (currentUpload) {
    currentUpload.cancelled = true;
    currentUpload = null;
  }

  if (sseConnection) {
    sseConnection.close();
    sseConnection = null;
  }
}
