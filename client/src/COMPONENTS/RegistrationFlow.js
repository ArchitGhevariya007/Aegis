import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line
import { authAPI, storage } from "../services/api";
import NavBar from "./NavBar";
import { Upload } from 'lucide-react';
/**
 * Digital ID System – Registration Flow (5 steps)
 * Clean UI, strong UX; demo-complete
 */

// Utility: simple classnames merger
function cx(...args) {
  return args.filter(Boolean).join(" ");
}

const STEPS = [
  { id: 1, label: "Basic Details" },
  { id: 2, label: "Password Setup" },
  { id: 3, label: "Document Upload & OCR" },
  { id: 4, label: "Facial Capture & Liveness" },
  { id: 5, label: "Face Matching Confirmation" },
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
  const navigate = useNavigate();
  
  // Schema-aligned state
  const [user, setUser] = useState({
    email: "",
    password: "", 
    confirmPassword: "",
    birthDate: "",
    residency: "",
    phoneNumber: "",
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
  const [errors, setErrors] = useState({});
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'success', 'error', 'camera_error'
  const [modalMessage, setModalMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Document upload handling (Step 2)
  const [docPreviewName, setDocPreviewName] = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [ocrEditable, setOcrEditable] = useState({
    documentType: "", // Always empty for user input
    name: "",
    dob: "",
    idNumber: "",
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

  // Page-level scroll (hidden scrollbar handled via CSS class)
  // No body locking here to allow natural page scrolling

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!user.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!user.birthDate) {
      newErrors.birthDate = "Date of birth is required";
    } else {
      const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
      if (age < 18) {
        newErrors.birthDate = "You must be at least 18 years old";
      }
    }
    
    if (!user.residency) {
      newErrors.residency = "Please select your residency";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!user.password) {
      newErrors.password = "Password is required";
    } else if (user.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    
    if (!user.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (user.password !== user.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation
  const canNextFromStep1 = useMemo(() => {
    if (!user.email) return false;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) return false;
    if (!user.birthDate) return false;
    if (!user.residency) return false;
    return true;
  }, [user]);

  const canNextFromStep2 = useMemo(() => {
    if (!user.password) return false;
    if (user.password.length < 6) return false;
    if (user.password !== user.confirmPassword) return false;
    return true;
  }, [user]);

  const canNextFromStep3 = useMemo(() => {
    return !!docBase64 && 
           !!ocrEditable.documentType.trim() && 
           !!ocrEditable.name.trim() && 
           !!ocrEditable.dob.trim() && 
           !!ocrEditable.idNumber.trim() && 
           !!ocrEditable.address.trim();
  }, [docBase64, ocrEditable]);
  const canNextFromStep4 = useMemo(
    () => (!!user.faceData.liveFaceImage || !usingCamera) && !processing, // allow demo skip but block during processing
    [user.faceData.liveFaceImage, usingCamera, processing]
  );

  // Navigation
  const goNext = () => setStep((s) => Math.min(5, s + 1));
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
      setModalType('camera_error');
      setModalMessage("Unable to access camera. You can proceed with the demo Skip.");
      setShowModal(true);
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

  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Show processing indicator
    setProcessing(true);
    setProcessingMessage("Processing face capture...");
    
    try {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth || 640;
      c.height = v.videoHeight || 480;
      const ctx = c.getContext("2d");
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const data = c.toDataURL("image/png");
      
      // Always set the image, with or without face detection
      const croppedFace = await detectAndCropFace(data);
      setUser((u) => ({
        ...u,
        faceData: { ...u.faceData, liveFaceImage: croppedFace, livenessVerified: true },
      }));
    } catch (error) {
      console.error('Error capturing face:', error);
      setModalType('error');
      setModalMessage('Failed to capture face. Please try again.');
      setShowModal(true);
    } finally {
      setProcessing(false);
      setProcessingMessage('');
    }
  };

  // Face match verification (Step 5)
  useEffect(() => {
    if (step === 5) {
      const hasBoth = user.faceData.liveFaceImage && user.faceData.idFaceImage;
      if (hasBoth) {
        // Show processing for face matching
        setProcessing(true);
        setProcessingMessage("Verifying face match...");
        
        // Simulate face matching delay
        setTimeout(() => {
          setUser((u) => ({
            ...u,
            kycStatus: "face_matched",
            faceData: { ...u.faceData, faceMatched: true },
          }));
          setProcessing(false);
          setProcessingMessage('');
        }, 2000); // 2 second delay for realistic processing
      }
    }
  }, [step, user.faceData.idFaceImage, user.faceData.liveFaceImage]);

  // Face detection using server-side SCRFD
  async function detectAndCropFace(base64) {
    try {
      console.log('Sending face detection request...');
      const response = await fetch('http://localhost:5000/api/ai/detect-faces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      
      const result = await response.json();
      console.log('Face detection response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Face detection failed');
      }
      
      if (result.faces.length === 0) {
        throw new Error('No faces detected in image');
      }
      
      return result.croppedFace; // Server returns the cropped face
    } catch (error) {
      console.error('Face detection error:', error);
      // Return the original image as fallback
      return base64;
    }
  }

  // Handle doc upload -> preview + OCR + face detection
  const handleDocChange = async (file) => {
    if (!file) return;
    setDocPreviewName(file.name);
    setProcessing(true);
    setProcessingMessage("Processing document and extracting information...");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setDocBase64(base64);
      
      try {
        
        // Process OCR extraction
        console.log('Sending document for OCR processing...');
        const ocrResponse = await fetch('http://localhost:5000/api/ocr/extract-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64, 
            documentType: 'id_card' 
          })
        });
        
        const ocrResult = await ocrResponse.json();
        console.log('OCR processing result:', ocrResult);
        
        // Extract face from document
        const croppedFace = await detectAndCropFace(base64);
        
        // Initialize empty form data
        let extractedData = {
          documentType: "", // Always empty for user input
          name: "",
          dob: "",
          idNumber: "",
          address: "",
        };

        if (ocrResult.success && ocrResult.data && ocrResult.data.documentData) {
          const ocrData = ocrResult.data.documentData;
          extractedData = {
            documentType: "", // Always empty for user input
            name: ocrData.name || "",
            dob: ocrData.dob || "", // Already in DD-MM-YYYY format from backend
            idNumber: ocrData.idNumber || "",
            address: ocrData.address || "",
          };
          
          // Log only detected fields
          const detectedFields = [];
          if (ocrData.name) detectedFields.push(`Name: ${ocrData.name}`);
          if (ocrData.dob) detectedFields.push(`DOB: ${ocrData.dob}`);
          if (ocrData.idNumber) detectedFields.push(`ID: ${ocrData.idNumber}`);
          if (ocrData.address) detectedFields.push(`Address: ${ocrData.address}`);
          
          console.log('✅ OCR detected fields:', detectedFields.length > 0 ? detectedFields : 'None');
          console.log('📊 OCR confidence:', ((ocrResult.data?.confidence || ocrResult.confidence || 0) * 100).toFixed(1) + '%');
        } else {
          console.log('❌ OCR failed or no text detected, fields left empty');
        }
        
        setUser((u) => ({
          ...u,
          documents: [
            {
              type: { type: "id_card" },
              fileName: file.name,
              filePath: "",
              ocrData: extractedData,
            },
          ],
          faceData: { ...u.faceData, idFaceImage: croppedFace },
        }));

        // Fill OCR editable fields with extracted data
        setOcrEditable(extractedData);
        
      } catch (error) {
        console.error('❌ Document processing failed:', error);
        // Set empty data on error
        const croppedFace = await detectAndCropFace(base64);
        setUser((u) => ({
          ...u,
          documents: [
            {
              type: { type: "id_card" },
              fileName: file.name,
              filePath: "",
            ocrData: {
              name: "",
              dob: "",
              documentType: "id_card",
            },
            },
          ],
          faceData: { ...u.faceData, idFaceImage: croppedFace },
        }));

        setOcrEditable({
          name: "",
          dob: "",
          documentType: "",
          address: "",
        });
      } finally {
        setProcessing(false);
        setProcessingMessage('');
      }
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
  // removed unused helper to silence warnings

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      console.log('Registration data:', {
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthDate: user.birthDate,
        residency: user.residency,
        hasIdImage: !!user.faceData.idFaceImage,
        hasLiveImage: !!user.faceData.liveFaceImage,
        idImageLength: user.faceData.idFaceImage?.length || 0,
        liveImageLength: user.faceData.liveFaceImage?.length || 0,
        ocrData: ocrEditable,
        documentData: user.documents[0]
      });

      // Call the registration API with face images and OCR data
      const response = await authAPI.register({
        email: user.email,
        password: user.password,
        birthDate: user.birthDate,
        residency: user.residency,
        phoneNumber: user.phoneNumber,
        idFaceImage: user.faceData.idFaceImage,
        liveFaceImage: user.faceData.liveFaceImage,
        ocrData: ocrEditable, // Include extracted OCR data
        documentData: user.documents[0] || null // Include document information
      });

      if (response.success) {
        // Update local state
        setUser((u) => ({ ...u, kycStatus: "completed" }));
        
        // Show success modal
        setModalType('success');
        setModalMessage("Registration successful! You can now login.");
        setShowModal(true);
      } else {
        setModalType('error');
        setModalMessage("Registration failed: " + response.message);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setModalType('error');
      setModalMessage("Registration failed: " + error.message);
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 animate-fade-in no-scrollbar" style={{ height: '100vh', overflowY: 'auto' }}>
      <NavBar />

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-10 animate-fade-up">
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
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 animate-fade-up w-full max-w-md mx-auto">
          <div key={step} className="animate-fade-up">
          {step === 1 && (
             <Step1Basic
               user={user}
               setUser={setUser}
               canNext={canNextFromStep1}
               errors={errors}
               onNext={() => {
                 if (validateStep1()) {
                   setUser((u) => ({ ...u, kycStatus: "pending" }));
                   goNext();
                 }
               }}
             />
           )}

          {step === 2 && (
            <Step2Password
              user={user}
              setUser={setUser}
              onBack={goBack}
              errors={errors}
              onNext={() => {
                if (validateStep2()) {
                  setUser((u) => ({ ...u, kycStatus: "password_set" }));
                  goNext();
                }
              }}
              canNext={canNextFromStep2}
            />
          )}

          {step === 3 && (
            <Step3Document
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
              canNext={canNextFromStep3}
            />
          )}

          {step === 4 && (
            <Step4Liveness
              onBack={goBack}
              onNext={() => {
                setUser((u) => ({ ...u, kycStatus: "liveness_verified" }));
                stopCamera();
                goNext();
              }}
              startCamera={startCamera}
              captureSnapshot={captureSnapshot}
              cameraReady={cameraReady}
              usingCamera={usingCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
              canNext={canNextFromStep4}
              processing={processing}
              processingMessage={processingMessage}
            />
          )}

          {step === 5 && (
            <Step5Confirmation
              user={user}
              onBack={goBack}
              onComplete={handleComplete}
              submitting={submitting}
              processing={processing}
              processingMessage={processingMessage}
            />
          )}
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Processing</h3>
              </div>
              <p className="text-slate-600 text-center">{processingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={cx(
                  "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                  modalType === 'success' ? "bg-green-100" : "bg-red-100"
                )}>
                  {modalType === 'success' ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {modalType === 'success' ? 'Success' : 
                   modalType === 'camera_error' ? 'Camera Error' : 'Error'}
                </h3>
              </div>
              <p className="text-slate-600 mb-6">{modalMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    if (modalType === 'success') {
                      navigate('/login');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Step components ---

function Step1Basic({ user, setUser, onNext, canNext, errors }) {
  const [dobInput, setDobInput] = useState("");

  useEffect(() => {
    if (user.birthDate) {
      const d = new Date(user.birthDate);
      if (!isNaN(d)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setDobInput(`${dd}-${mm}-${yyyy}`);
      }
    }
  }, [user.birthDate]);

  const handleDobChange = (val) => {
    // Keep as dd-mm-yyyy
    const cleaned = val.replace(/[^0-9-]/g, "").slice(0, 10);
    let next = cleaned;
    if (cleaned.length === 2 || cleaned.length === 5) {
      if (!cleaned.endsWith("-")) next = cleaned + "-";
    }
    setDobInput(next);

    const parts = next.split("-");
    if (parts.length === 3 && parts[2]?.length === 4) {
      const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
      if (dd && mm && yyyy) {
        const iso = new Date(yyyy, mm - 1, dd).toISOString();
        setUser((u) => ({ ...u, birthDate: iso }));
      }
    }
  };

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
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="text-sm text-slate-600">Date of Birth</label>
          <input
            type="text"
            inputMode="numeric"
            value={dobInput}
            onChange={(e) => handleDobChange(e.target.value)}
            placeholder="dd-mm-yyyy"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.birthDate ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.birthDate && (
            <p className="mt-1 text-xs text-red-500">{errors.birthDate}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-slate-600">Phone Number</label>
          <input
            type="tel"
            value={user.phoneNumber}
            onChange={(e) => setUser((u) => ({ ...u, phoneNumber: e.target.value }))}
            placeholder="+61 234 567 890"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.phoneNumber ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-slate-600">Select Residency</label>
          <div className="relative mt-2">
            <select
              className={cx(
                "w-full appearance-none rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
                errors.residency ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
              )}
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
          {errors.residency && (
            <p className="mt-1 text-xs text-red-500">{errors.residency}</p>
          )}
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

function Step2Password({ user, setUser, onBack, onNext, canNext, errors }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Password Setup</h2>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-slate-600">Password</label>
          <input
            type="password"
            value={user.password}
            onChange={(e) => setUser((u) => ({ ...u, password: e.target.value }))}
            placeholder="Enter your password"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.password ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Password must be at least 6 characters long with uppercase, lowercase, and number</p>
          )}
        </div>

        <div>
          <label className="text-sm text-slate-600">Confirm Password</label>
          <input
            type="password"
            value={user.confirmPassword}
            onChange={(e) => setUser((u) => ({ ...u, confirmPassword: e.target.value }))}
            placeholder="Confirm your password"
            className={cx(
              "mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2",
              errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border px-4 py-3 text-slate-700 hover:bg-slate-50"
        >
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

function Step3Document({
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
          <Upload className="w-6 h-6 text-slate-600" />
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
            Extracted Information (Editable) <span className="text-red-500">*</span>
          </label>
          
          {/* Document Type - First field, always empty for user input */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Document Type *</label>
            <input
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="Enter document type (e.g., PAN Card, Aadhaar Card, Passport)"
              value={ocrEditable.documentType}
              onChange={(e) => setOcrEditable((o) => ({ ...o, documentType: e.target.value }))}
              required
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
            <input
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="Full Name"
              value={ocrEditable.name}
              onChange={(e) => setOcrEditable((o) => ({ ...o, name: e.target.value }))}
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Date of Birth (DD-MM-YYYY) *</label>
            <input
              type="text"
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="DD-MM-YYYY"
              value={ocrEditable.dob}
              onChange={(e) => setOcrEditable((o) => ({ ...o, dob: e.target.value }))}
              pattern="\d{2}-\d{2}-\d{4}"
              required
            />
          </div>

          {/* ID Number */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">ID Number *</label>
            <input
              className="rounded-xl border px-4 py-3 w-full"
              placeholder="ID Number (PAN, Aadhaar, etc.)"
              value={ocrEditable.idNumber || ''}
              onChange={(e) => setOcrEditable((o) => ({ ...o, idNumber: e.target.value }))}
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Address *</label>
            <textarea
              className="rounded-xl border px-4 py-3 w-full resize-none"
              placeholder="Complete Address"
              rows={3}
              value={ocrEditable.address}
              onChange={(e) => setOcrEditable((o) => ({ ...o, address: e.target.value }))}
              required
            />
          </div>

          {/* Disclaimer Message */}
          <div className=" p-2 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-xs text-amber-800">
                <p className="mt-1">
                  *Extracted information may be inaccurate due to OCR limitations. 
                  Please double-check all fields carefully before proceeding.
                </p>
              </div>
            </div>
          </div>
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

function Step4Liveness({
  onBack,
  onNext,
  startCamera,
  captureSnapshot,
  cameraReady,
  usingCamera,
  videoRef,
  canvasRef,
  canNext,
  processing,
  processingMessage,
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Facial Capture & Liveness Check</h2>

      <div className="mt-6 rounded-2xl bg-slate-100 text-slate-800 p-6 border">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-4 border">
          <div className="flex items-center justify-center mb-3 text-2xl">📷</div>
          <p className="text-center text-sm text-slate-600 mb-3">
            Position your face in the camera
          </p>
          <div className="rounded-lg border border-slate-300 h-64 flex items-center justify-center overflow-hidden bg-slate-50 relative">
            <video ref={videoRef} className="h-full" />
            <canvas ref={canvasRef} className="hidden" />
            {!usingCamera && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-slate-400">Camera View</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {processing && (
        <div className="mt-6 rounded-2xl border p-4 bg-blue-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 font-medium">{processingMessage}</span>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onBack} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
          Back
        </button>
        {!usingCamera ? (
          <button onClick={startCamera} className="flex-1 min-w-[140px] rounded-xl border px-4 py-3 hover:bg-slate-50">
            Start Camera
          </button>
        ) : (
          <button onClick={captureSnapshot} disabled={!cameraReady || processing} className={cx(
            "flex-1 min-w-[140px] rounded-xl border px-4 py-3",
            cameraReady && !processing ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
          )}>
            {processing ? "Processing..." : "Capture"}
          </button>
        )}
        <button onClick={onNext} disabled={!canNext} className={cx(
          "flex-1 min-w-[140px] rounded-xl px-4 py-3 text-white", 
          canNext ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
        )}>
          {"Next"}
        </button>
      </div>
    </div>
  );
}

function Step5Confirmation({ user, onBack, onComplete, submitting, processing, processingMessage }) {
  const success = user.faceData.faceMatched;

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">Face Matching Confirmation</h2>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-600 mb-2">ID Photo</p>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {user.faceData.idFaceImage ? (
              <img src={user.faceData.idFaceImage} alt="ID" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-slate-400 text-3xl">📷 ID Document Photo</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-600 mb-2">Live Capture</p>
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {user.faceData.liveFaceImage ? (
              <img src={user.faceData.liveFaceImage} alt="Live" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-slate-400 text-3xl">📷 Your Live Photo</div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {processing && (
        <div className="mt-6 rounded-2xl border p-6 bg-blue-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 font-medium">{processingMessage}</span>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border p-6 text-center">
        <p className={cx("text-lg font-medium", 
          processing ? "text-blue-600" : 
          success ? "text-emerald-600" : "text-amber-600"
        )}> 
          {processing ? "Verifying Face Match..." : 
           success ? "Face Match Successful" : "Awaiting Face Match"}
        </p>
        <p className="text-slate-600 mt-1">
          {processing ? "Please wait while we verify your identity" :
           success
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
          disabled={!success || submitting || processing}
          className={cx(
            "flex-1 rounded-xl px-4 py-3 text-white",
            success && !submitting && !processing
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-indigo-300 cursor-not-allowed"
          )}
        >
          {processing ? "Verifying..." : submitting ? "Completing..." : "Complete Registration"}
        </button>
      </div>
    </div>
  );
}
