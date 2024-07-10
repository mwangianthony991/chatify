const FILE_MIME_TYPES = {
    "image/bmp": "image",
    "image/jpeg": "image",
    "image/tiff": "image",
    "image/x-png": "image",
    "image/png": "image",
    "image/gif": "image",
    "video/mpeg": "video",
    "application/mp4": "video",
    "video/mp4": "video",
    "video/vnd.vivo": "video",
    "video/quicktime": "video",
    "video/x-msvideo": "video",
    "video/avi": "video"
};

const getFileMimeType = (mimeType) => {
    if (!mimeType) {
        return
    }

    return FILE_MIME_TYPES[mimeType] || null
};

export { getFileMimeType };
