import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, storage } from "../services/api";
import NavBar from "./NavBar";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [showFaceStep, setShowFaceStep] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Prevent body scroll while on login route
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const validateLogin = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        storage.setUser(response.user);
        storage.setToken(response.token);

        if (errorCount > 0) {
          setShowFaceStep(true);
        } else {
          setSuccess(true);
          setTimeout(() => { navigate('/dashboard'); }, 600);
        }
      } else {
        setErrorCount(errorCount + 1);
        setErrors({ general: "Invalid credentials. Please try again." });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorCount(errorCount + 1);
      setErrors({ general: "Login failed: " + error.message });
    } finally {
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 animate-fade-up">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-emerald-600">Login Successful!</h1>
          {capturedImage && (
            <img src={capturedImage} alt="Face snapshot" className="mt-4 rounded-xl" />
          )}
        </div>
      </div>
    );
  }

  return (
<>
    <NavBar />

    <div className="min-h-screen flex items-center justify-center bg-slate-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md animate-fade-up">
        {!showFaceStep ? (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className={`mt-6 w-full rounded-xl px-4 py-3 ${
                loading
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white animate-fade-up`}
              style={{ animationDelay: '180ms' }}
            >
              {loading ? 'Logging in...' : 'Login'}
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
