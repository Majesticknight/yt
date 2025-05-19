import { useState, useRef } from "react";
import axios from "axios";
import LoadingBar from "react-top-loading-bar";

export default function App() {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState([]);
  const [title, setTitle] = useState("");
  const [id, setId] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const loadingBar = useRef(null);

  const fetchFormats = async () => {
    try {
      loadingBar.current.continuousStart();
      const res = await axios.get("http://localhost:3000/formats", {
        params: { url },
      });
      setFormats(res.data.formats);
      setTitle(res.data.title);
      setId(res.data.id);
    } catch {
      alert("Error fetching formats");
    } finally {
      loadingBar.current.complete();
    }
  };

  const download = async (format) => {
    setDownloadingId(format.format_id);
    loadingBar.current.continuousStart();

    try {
      const res = await axios.post(
        "http://localhost:3000/download",
        { url, format_id: format.format_id, hasAudio: format.hasAudio, hasVideo: format.hasVideo, id },
        { responseType: "blob" }
      );

      const disposition = res.headers["content-disposition"];
      let filename = "download.mp4";
      if (disposition) {
        const m = disposition.match(/filename="(.+)"/);
        if (m) filename = m[1];
      }

      const blob = new Blob([res.data], { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Download failed");
    } finally {
      loadingBar.current.complete();
      setDownloadingId(null);
    }
  };

  // Spinner SVG
  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-700 dark:bg-gray-900 text-white transition-colors">
      <LoadingBar color="#FF0000" ref={loadingBar} height={3} />

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Hero Section */}
        {!formats.length && (
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl font-extrabold">YouTube Downloader</h1>
            <p className="text-lg opacity-80">
              Quickly fetch and download YouTube videos or audio in your desired format.
            </p>
            <div className="flex justify-center space-x-3">
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm">Fast</span>
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm">Secure</span>
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm">Free</span>
            </div>
          </div>
        )}

        {/* URL input */}
        <div className="flex mb-6 gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL"
            className="flex-grow p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent focus:outline-none"
          />
          <button
            onClick={fetchFormats}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Get Formats
          </button>
        </div>

        {/* Quick Guide */}
        {!formats.length && (
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded mb-6">
            <h2 className="text-xl font-semibold text-red-600 mb-3">Quick Guide</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Paste a valid YouTube URL above.</li>
              <li>Click "Get Formats" to retrieve options.</li>
              <li>Select a format and click "Download".</li>
            </ul>
          </div>
        )}

        {/* Video Title */}
        {title && <h3 className="text-xl font-medium mb-4">🎞️ {title}</h3>}

        {/* Formats List */}
        {formats.length > 0 && (
          <ul className="space-y-3 mb-6">
            {formats.map((f) => {
              const isDownloading = downloadingId === f.format_id;
              return (
                <li
                  key={f.format_id}
                  className="flex justify-between items-center border border-gray-300 dark:border-gray-700 p-3 rounded"
                >
                  <div>
                    <div className="font-medium">
                      {f.resolution || f.format_note} ({f.ext})
                      {f.hasVideo && <span className="ml-2">🎥</span>}
                      {!f.hasVideo && f.hasAudio && <span className="ml-2">🔊</span>}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {f.filesize}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => download(f)}
                    disabled={!!downloadingId}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                  >
                    {isDownloading ? <Spinner /> : "Download"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
