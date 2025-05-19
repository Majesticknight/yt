// === src/App.jsx ===
import { useState, useRef } from "react";
import axios from "axios";
import LoadingBar from "react-top-loading-bar";

export default function App() {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState([]);
  const [title, setTitle] = useState("");
  const [id, setId] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const loadingBar = useRef(null);

  const fetchFormats = async () => {
    try {
      loadingBar.current.continuousStart();
      const res = await axios.get("http://localhost:3000/formats", { params: { url } });
      setFormats(res.data.formats);
      setTitle(res.data.title);
      setId(res.data.id);
    } catch (err) {
      alert("Error fetching formats");
    } finally {
      loadingBar.current.complete();
    }
  };

  const download = async (format) => {
    setDownloadingId(format.format_id);
    setDownloadProgress(0);
    loadingBar.current.continuousStart();

    try {
      const res = await axios.post(
        "http://localhost:3000/download",
        { url, format_id: format.format_id, hasAudio: format.hasAudio, hasVideo: format.hasVideo, id },
        {
          responseType: "blob",
          onDownloadProgress: (e) => {
            if (!e.total) return;
            const pct = Math.round((e.loaded * 100) / e.total);
            setDownloadProgress(pct);
            loadingBar.current.staticStart();
          },
        }
      );

      const disposition = res.headers["content-disposition"];
      let filename = "download.mp4";
      if (disposition) {
        const m = disposition.match(/filename="(.+)"/);
        if (m) filename = m[1];
      }
      const blob = new Blob([res.data], { type: "video/mp4" });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Download failed");
    } finally {
      loadingBar.current.complete();
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <LoadingBar color="#FF0000" ref={loadingBar} height={3} />

      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-red-600 text-center mb-6">
          YouTube Downloader
        </h1>

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

        {!formats.length && (
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded mb-6">
            <h2 className="text-xl font-semibold text-red-600 mb-3">Quick Guide</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Paste a valid YouTube URL above.</li>
              <li>Click "Get Formats" to retrieve options.</li>
              <li>Select a format and click "Download".</li>
            </ul>
            <h2 className="text-xl font-semibold text-red-600 mt-4 mb-2">FAQ</h2>
            <div className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <p><strong>Q:</strong> Can I download audio only?<br/><strong>A:</strong> Yes, choose formats with only audio.</p>
              <p><strong>Q:</strong> Why separate audio/video?<br/><strong>A:</strong> Some qualities are split streams.</p>
            </div>
          </div>
        )}

        {title && <h3 className="text-xl font-medium mb-4">🎞️ {title}</h3>}

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

                  <button
                    onClick={() => download(f)}
                    disabled={!!downloadingId}
                    className="relative px-4 py-2 bg-red-600 text-white rounded overflow-hidden disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {isDownloading ? `${downloadProgress}%` : "Download"}
                    </span>
                    {isDownloading && (
                      <div
                        className="absolute bottom-0 left-0 h-full bg-red-800 opacity-30"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    )}
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
