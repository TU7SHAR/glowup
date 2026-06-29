"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
  User,
  Target,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const goals = [
  { id: "dating", label: "Dating", emoji: "\u{1F498}" },
  { id: "confidence", label: "Confidence", emoji: "\u{1F4AA}" },
  { id: "college", label: "College", emoji: "\u{1F393}" },
  { id: "professional", label: "Professional", emoji: "\u{1F4BC}" },
  { id: "wedding", label: "Wedding", emoji: "\u{1F48D}" },
  { id: "social-media", label: "Social Media", emoji: "\u{1F4F8}" },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Photo must be under 10MB");
        return;
      }
      setPhoto(file);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handlePhotoSelect(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      // Generate session ID for anonymous tracking
      const sessionId = crypto.randomUUID();
      localStorage.setItem("glowup_session_id", sessionId);

      const formData = new FormData();
      formData.append("selfie", photo);
      formData.append("age", age);
      formData.append("gender", gender);
      formData.append("goal", selectedGoal);
      formData.append("sessionId", sessionId);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Store analysis ID for results page
      localStorage.setItem("glowup_analysis_id", data.analysisId);
      localStorage.setItem("glowup_session_id", data.sessionId);

      // Navigate to analysis page
      router.push(`/analysis?id=${data.analysisId}`);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = age && gender && selectedGoal;
  const canSubmit = photo && !isSubmitting;


  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-accent text-white" : "bg-surface-light text-muted"}`}>1</div>
          <div className="w-8 h-0.5 bg-surface-light"><div className={`h-full transition-all ${step >= 2 ? "bg-accent w-full" : "w-0"}`} /></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-accent text-white" : "bg-surface-light text-muted"}`}>2</div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-accent" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Tell us about you</h1>
                  <p className="text-muted">This helps our AI give you personalized recommendations</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Age</label>
                  <input type="number" min="13" max="80" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Enter your age" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Male", "Female", "Other"].map((g) => (
                      <button key={g} onClick={() => setGender(g.toLowerCase())} className={`py-3 rounded-xl border text-sm font-medium transition-all ${gender === g.toLowerCase() ? "border-accent bg-accent/10 text-accent-light" : "border-border bg-surface hover:border-accent/30 text-muted"}`}>{g}</button>
                    ))}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2"><Target className="w-4 h-4 inline mr-1" />What&apos;s your goal?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {goals.map((goal) => (
                      <button key={goal.id} onClick={() => setSelectedGoal(goal.id)} className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${selectedGoal === goal.id ? "border-accent bg-accent/10 text-accent-light" : "border-border bg-surface hover:border-accent/30 text-muted"}`}>
                        <span>{goal.emoji}</span><span>{goal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => setStep(2)} disabled={!canProceedStep1} className={`w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all ${canProceedStep1 ? "bg-accent hover:bg-accent-dark text-white glow-hover" : "bg-surface-light text-muted cursor-not-allowed"}`}>
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-accent" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Upload your selfie</h1>
                  <p className="text-muted">A clear, front-facing photo works best</p>
                </div>

                {!photoPreview ? (
                  <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                    <Upload className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="font-medium mb-1">Drop your photo here or click to browse</p>
                    <p className="text-sm text-muted">JPG, PNG up to 10MB</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoSelect(e.target.files[0])} className="hidden" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="glass rounded-2xl p-4">
                      <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden">
                        <img src={photoPreview} alt="Your selfie" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-2 border-accent/30 rounded-xl" />
                      </div>
                      <p className="text-center text-sm text-success mt-3 font-medium">Great photo! Ready to analyze.</p>
                    </div>
                    <button onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-light flex items-center justify-center hover:bg-red-500/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}


                <div className="glass rounded-xl p-4">
                  <p className="text-xs font-medium text-accent-light mb-2">TIPS FOR BEST RESULTS</p>
                  <ul className="space-y-1 text-xs text-muted">
                    <li>&#x2022; Face the camera directly</li>
                    <li>&#x2022; Use natural lighting</li>
                    <li>&#x2022; Remove sunglasses or hats</li>
                    <li>&#x2022; Show your full face and hair</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 py-4 px-6 rounded-full border border-border hover:border-accent/30 text-muted transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={!canSubmit} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all ${canSubmit ? "bg-accent hover:bg-accent-dark text-white pulse-glow" : "bg-surface-light text-muted cursor-not-allowed"}`}>
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Analyze My Face</>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-muted">Your photo is processed securely and never shared. We delete it after analysis.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
