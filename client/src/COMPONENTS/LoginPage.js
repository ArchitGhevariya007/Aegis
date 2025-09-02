import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [showFaceStep, setShowFaceStep] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [success, setSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const correctEmail = "test@example.com";
  const correctPassword = "password123";

  const handleLogin = () => {
    if (email === correctEmail && password === correctPassword) {
      if (errorCount > 0) {
        setShowFaceStep(true);
      } else {
        setSuccess(true);
      }
    } else {
      setErrorCount(errorCount + 1);
      alert("Invalid credentials. Please try again.");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setUsingCamera(true);
      }
    } catch (e) {
      alert("Unable to access camera.");
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/png");
    setCapturedImage(data);
    setSuccess(true);
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setUsingCamera(false);
    setCameraReady(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-emerald-600">Login Successful!</h1>
          {capturedImage && (
            <img src={capturedImage} alt="Face Snapshot" className="mt-4 rounded-xl" />
          )}
        </div>
      </div>
    );
  }

  return (
<>
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
     

    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md">
        {!showFaceStep ? (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleLogin}
              className="mt-6 w-full bg-indigo-600 text-white rounded-xl px-4 py-3 hover:bg-indigo-700"
            >
              Login
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-center mb-4">Face Verification Required</h2>
            <div className="rounded-xl bg-slate-900 p-4 text-center">
              <video ref={videoRef} className="w-full rounded-xl" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="mt-4 flex gap-3">
              {!usingCamera ? (
                <button
                  onClick={startCamera}
                  className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={captureSnapshot}
                    disabled={!cameraReady}
                    className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50"
                  >
                    Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex-1 rounded-xl border px-4 py-3 hover:bg-slate-50"
                  >
                    Stop
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
