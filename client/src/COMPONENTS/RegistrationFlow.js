import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
/**
 * Digital ID System – Registration Flow (4 steps)
 *
 * Styling uses Tailwind classes; no external UI kits required.
 */

// Utility: simple classnames merger
function cx(...args) {
  return args.filter(Boolean).join(" ");
}

const STEPS = [
  { id: 1, label: "Basic Details" },
  { id: 2, label: "Document Upload & OCR" },
  { id: 3, label: "Facial Capture & Liveness" },
  { id: 4, label: "Face Matching Confirmation" },
];

// Residency list (sample)
const RESIDENCIES = [
  "United States",
  "Canada",
  "Japan",
  "Australia",
  "Bangkok",
];

export default function RegistrationFlow() {
  // Schema-aligned state
  const [user, setUser] = useState({
    email: "",
    password: "", 
    birthDate: "",
    residency: "",
    kycStatus: "pending",
    documents: [],
    faceData: {
      idFaceImage: "",
      liveFaceImage: "",
      faceEncoding: "",
      livenessVerified: false,
      faceMatched: false,
    },
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Document upload handling (Step 2)
  const [docPreviewName, setDocPreviewName] = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [ocrEditable, setOcrEditable] = useState({
    name: "",
    dob: "",
    idNumber: "",
    documentType: "",
    address: "",
  });

  // Camera refs (Step 3)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);

  // Derived: step title subtitle
  const stepTitle = useMemo(() => "Registration Process", []);
  const stepSubtitle = useMemo(
    () => "Complete your digital identity verification",
    []
  );

  // Validation
  const canNextFromStep1 = useMemo(() => {
    if (!user.email) return false;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) return false;
    if (!user.birthDate) return false;
    if (!user.residency) return false;
    return true;
  }, [user]);

  const canNextFromStep2 = useMemo(() => !!docBase64, [docBase64]);
  const canNextFromStep3 = useMemo(
    () => !!user.faceData.liveFaceImage || !usingCamera, // allow demo skip
    [user.faceData.liveFaceImage, usingCamera]
  );

  // Navigation
  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Camera controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setUsingCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (e) {
      console.error("Camera error", e);
      setUsingCamera(false);
      setCameraReady(false);
      alert("Unable to access camera. You can proceed with the demo Skip.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setUsingCamera(false);
    setCameraReady(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/png");
    setUser((u) => ({
      ...u,
      faceData: { ...u.faceData, liveFaceImage: data, livenessVerified: true },
    }));
  };

  // Simulated face match (Step 4)
  useEffect(() => {
    if (step === 4) {
      const hasBoth = user.faceData.liveFaceImage && user.faceData.idFaceImage;
      setUser((u) => ({
        ...u,
        kycStatus: hasBoth ? "face_matched" : u.kycStatus,
        faceData: { ...u.faceData, faceMatched: !!hasBoth },
      }));
    }
  }, [step]);

  // Handle doc upload -> preview + fake OCR fill-in
  const handleDocChange = async (file) => {
    if (!file) return;
    setDocPreviewName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setDocBase64(base64);
      // Extract a mock portrait crop placeholder as idFaceImage (for demo)
      setUser((u) => ({
        ...u,
        documents: [
          {
            type: { type: "id_card" },
            fileName: file.name,
            filePath: "",
            ocrData: {
              name: ocrEditable.name || "John Doe",
              dob: ocrEditable.dob || user.birthDate,
              idNumber: ocrEditable.idNumber || "ID123456789",
              documentType: ocrEditable.documentType || "id_card",
            },
          },
        ],
        faceData: { ...u.faceData, idFaceImage: base64 },
      }));

      // Fill OCR editable fields (demo)
      setOcrEditable((cur) => ({
        name: cur.name || "John Doe",
        dob: cur.dob || formatForInputDate(user.birthDate) || "1990-01-01",
        idNumber: cur.idNumber || "ID123456789",
        documentType: cur.documentType || "ID Card",
        address: cur.address || "123 Main St, City, State",
      }));
    };
    reader.readAsDataURL(file);
  };

  const formatForInputDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${dt.getFullYear()}-${m}-${day}`;
  };

  // Final submit payload aligned with schema
  const buildPayload = () => ({
    email: user.email,
    password: user.password || undefined,
    birthDate: user.birthDate ? new Date(user.birthDate) : null,
    residency: user.residency,
    kycStatus: user.kycStatus,
    documents: user.documents.map((d) => ({
      type: d.type?.type || "id_card",
      fileName: d.fileName,
      filePath: d.filePath,
      ocrData: d.ocrData,
      uploadDate: new Date(),
    })),
    faceData: user.faceData,
  });

  const handleComplete = async () => {
    setSubmitting(true);
    // Replace with your API call. For now, we just log.
    const payload = buildPayload();
    console.log("FINAL REGISTRATION PAYLOAD", payload);
    // Fake complete
    setTimeout(() => {
      setUser((u) => ({ ...u, kycStatus: "completed" }));
      setSubmitting(false);
      alert("Registration Complete (demo) – check console for payload");
    }, 400);
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Nav */}
      <div className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Digital ID System</span>
             <Link to="/">
            <span className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-full bg-indigo-600" />
              Registration
            </span>
            </Link>
            <Link to="/login" className="text-indigo-600 font-semibold">Login</Link>
            <a className="text-slate-500 hover:text-slate-700 text-sm" href="#">Dashboard</a>
            <a className="text-slate-500 hover:text-slate-700 text-sm" href="#">Voting</a>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-3">
            <span>
              Role: <span className="font-medium text-slate-700">User</span>
            </span>
            <button className="px-3 py-1 text-slate-700 border rounded-full hover:bg-slate-100">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center">
          {stepTitle}
        </h1>
        <p className="text-center text-slate-500 mt-2">{stepSubtitle}</p>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {STEPS.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div
                  className={cx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm", 
                    done && "bg-emerald-500 text-white",
                    active && !done && "bg-indigo-600 text-white",
                    !active && !done && "bg-slate-200 text-slate-600"
                  )}
                >
                  {s.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          {step === 1 && (
            <Step1Basic
              user={user}
              setUser={setUser}
              canNext={canNextFromStep1}
              onNext={() => {
                setUser((u) => ({ ...u, kycStatus: "pending" }));
                goNext();
              }}
            />
          )}

          {step === 2 && (
            <Step2Document
              docPreviewName={docPreviewName}
              setDocPreviewName={setDocPreviewName}
              docBase64={docBase64}
              onFileChange={handleDocChange}
              ocrEditable={ocrEditable}
              setOcrEditable={setOcrEditable}
              onBack={goBack}
              onNext={() => {
                setUser((u) => ({ ...u, kycStatus: "document_uploaded" }));
                goNext();
              }}
              canNext={canNextFromStep2}
            />
          )}

          {step === 3 && (
            <Step3Liveness
              onBack={goBack}
              onNext={() => {
                setUser((u) => ({ ...u, kycStatus: "liveness_verified" }));
                stopCamera();
                goNext();
              }}
              startCamera={startCamera}
              stopCamera={stopCamera}
              captureSnapshot={captureSnapshot}
              cameraReady={cameraReady}
              usingCamera={usingCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
              canNext={canNextFromStep3}
            />
          )}

          {step === 4 && (
            <Step4Confirmation
              user={user}
              onBack={goBack}
              onComplete={handleComplete}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Step components ---

function Step1Basic({ user, setUser, onNext, canNext }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Basic Details</h2>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-slate-600">Email Address</label>
          <input
            type="email"
            value={user.email}
            onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))}
            placeholder="Email Address"
            className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Date of Birth</label>
          <input
            type="date"
            value={formatInputDateValue(user.birthDate)}
            onChange={(e) => setUser((u) => ({ ...u, birthDate: e.target.value }))}
            placeholder="dd/mm/yyyy"
            className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Select Residency</label>
          <div className="relative mt-2">
            <select
              className="w-full appearance-none rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={user.residency}
              onChange={(e) => setUser((u) => ({ ...u, residency: e.target.value }))}
            >
              <option value="" disabled>
                Select Residency
              </option>
              {RESIDENCIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onNext}
          disabled={!canNext}
          className={cx(
            "w-full rounded-xl px-4 py-3 text-white", 
            canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function formatInputDateValue(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function Step2Document({
  docPreviewName,
  setDocPreviewName,
  docBase64,
  onFileChange,
  ocrEditable,
  setOcrEditable,
  onBack,
  onNext,
  canNext,
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Document Upload & OCR</h2>

      <div className="mt-6 border-2 border-dashed rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <span className="text-2xl">⬆️</span>
        </div>
        <p className="text-slate-600">Upload your ID card or driver's license</p>
        <div className="mt-4">
          <label className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 cursor-pointer bg-white hover:bg-slate-50">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              className="hidden"
            />
            <span>Choose File</span>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-sm text-slate-600">Document Preview</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="text-slate-400">📎</span>
            <span className="text-sm text-slate-700">
              {docPreviewName || "No file selected"}
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            Extracted Information (Editable)
          </label>
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Full Name"
            value={ocrEditable.name}
            onChange={(e) => setOcrEditable((o) => ({ ...o, name: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-xl border px-4 py-3"
            value={ocrEditable.dob}
            onChange={(e) => setOcrEditable((o) => ({ ...o, dob: e.target.value }))}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="ID Number"
            value={ocrEditable.idNumber}
            onChange={(e) => setOcrEditable((o) => ({ ...o, idNumber: e.target.value }))}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Document Type"
            value={ocrEditable.documentType}
            onChange={(e) => setOcrEditable((o) => ({ ...o, documentType: e.target.value }))}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Address"
            value={ocrEditable.address}
            onChange={(e) => setOcrEditable((o) => ({ ...o, address: e.target.value }))}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className={cx(
            "flex-1 rounded-xl px-4 py-3 text-white", 
            canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Step3Liveness({
  onBack,
  onNext,
  startCamera,
  stopCamera,
  captureSnapshot,
  cameraReady,
  usingCamera,
  videoRef,
  canvasRef,
  canNext,
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Facial Capture & Liveness Check</h2>

      <div className="mt-6 rounded-2xl bg-slate-900 text-slate-100 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-slate-800 p-4">
          <div className="flex items-center justify-center mb-3 text-2xl">📷</div>
          <p className="text-center text-sm text-slate-300 mb-3">
            Position your face in the camera
          </p>
          <div className="rounded-lg border border-slate-700 h-64 flex items-center justify-center overflow-hidden bg-slate-900">
            <video ref={videoRef} className="h-full" />
            <canvas ref={canvasRef} className="hidden" />
            {!usingCamera && (
              <span className="text-slate-500">Camera View</span>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-800 p-4">
          <p className="font-medium mb-3">Instructions:</p>
          <ul className="text-sm space-y-1 text-slate-300 list-disc list-inside">
            <li>Look directly at the camera</li>
            <li>Turn head left slowly</li>
            <li>Turn head right slowly</li>
            <li>Blink naturally</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onBack} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        {!usingCamera ? (
          <button onClick={startCamera} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
            Start Camera
          </button>
        ) : (
          <>
            <button onClick={captureSnapshot} disabled={!cameraReady} className={cx(
              "flex-1 min-w-[140px] rounded-xl border px-4 py-3",
              cameraReady ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
            )}>
              Capture
            </button>
            <button onClick={stopCamera} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
              Stop Camera
            </button>
          </>
        )}
        <button onClick={onNext} disabled={!canNext} className={cx(
          "flex-1 min-w-[140px] rounded-xl px-4 py-3 text-white", 
          canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
        )}>
          {"Next"}
        </button>
        <button onClick={onNext} className="flex-1 min-w-[140px] rounded-xl bg-indigo-50 text-indigo-700 px-4 py-3">
          <span className="mr-2">📷</span> Skip (Demo)
        </button>
      </div>
    </div>
  );
}

function Step4Confirmation({ user, onBack, onComplete, submitting }) {
  const success = user.faceData.faceMatched;

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Face Matching Confirmation</h2>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-600 mb-2">ID Photo</p>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {user.faceData.idFaceImage ? (
              <img src={user.faceData.idFaceImage} alt="ID Document Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 text-3xl">📷 ID Document Photo</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-600 mb-2">Live Capture</p>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {user.faceData.liveFaceImage ? (
              <img src={user.faceData.liveFaceImage} alt="Live Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 text-3xl">📷 Your Live Photo</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-6 text-center">
        <p className={cx("text-lg font-medium", success ? "text-emerald-600" : "text-amber-600")}> 
          {success ? "Face Match Successful" : "Awaiting Face Match"}
        </p>
        <p className="text-slate-600 mt-1">
          {success
            ? "Your identity has been verified successfully"
            : "Ensure both photos are provided to verify your identity"}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!success || submitting}
          className={cx(
            "flex-1 rounded-xl px-4 py-3 text-white",
            success && !submitting
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          {submitting ? "Completing..." : "Complete Registration"}
        </button>
      </div>
    </div>
  );
}
