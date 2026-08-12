import { useRef } from "react";
import { Paperclip, FileText, Image as ImageIcon, X, Loader2, Upload } from "lucide-react";

const isImage = (resourceType) => resourceType === "image";

const AttachmentList = ({ attachments, canRemove, currentUserId, onUpload, onRemove, isUploading, removingId }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  return (
    <div className="space-y-3">
      {attachments.length === 0 ? (
        <p className="py-3 text-center text-sm text-ink-muted">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-surface-3 bg-surface px-3.5 py-2.5"
            >
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2.5 text-sm text-ink-primary hover:text-cyan-neon"
              >
                {isImage(att.resourceType) ? (
                  <ImageIcon size={16} className="shrink-0 text-cyan-neon" />
                ) : ( 
                  <FileText size={16} className="shrink-0 text-violet-neon" />
                )}
                <span className="truncate">{att.filename}</span>
              </a>
              {(canRemove || att.uploadedBy?._id === currentUserId) && (
                <button
                  onClick={() => onRemove(att._id)}
                  disabled={removingId === att._id}
                  className="shrink-0 rounded p-1 text-ink-faint hover:bg-rose-neon/10 hover:text-rose-neon"
                  aria-label={`Remove ${att.filename}`}
                >
                  {removingId === att._id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-surface-3 py-2.5 text-sm text-ink-muted hover:border-cyan-neon/40 hover:text-ink-primary disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload size={15} /> Upload image or PDF
          </>
        )}
      </button>
      <p className="flex items-center gap-1 text-xs text-ink-faint">
        <Paperclip size={11} /> Images and PDFs only, up to 10MB
      </p>
    </div>
  );
};

export default AttachmentList;
