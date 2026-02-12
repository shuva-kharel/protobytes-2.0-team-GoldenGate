import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
// @ts-ignore - ad-bs-converter doesn't have types
import converter from 'ad-bs-converter';

const KYC: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [adDate, setAdDate] = useState('');
  const [bsDate, setBsDate] = useState('');

  // Handle AD date change
  const handleAdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAd = e.target.value;
    setAdDate(newAd);
    
    if (newAd) {
      try {
        const [y, m, d] = newAd.split('-');
        const bsResult = converter.ad2bs(`${y}/${m}/${d}`);
        setBsDate(`${bsResult.en.year}-${String(bsResult.en.month).padStart(2, '0')}-${String(bsResult.en.day).padStart(2, '0')}`);
      } catch (err) {
        console.error('AD to BS conversion failed', err);
      }
    }
  };

  // Handle BS date change (simplified manual sync)
  const handleBsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBs = e.target.value;
    setBsDate(newBs);
    
    // Attempt conversion only if format is YYYY-MM-DD
    const bsRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (bsRegex.test(newBs)) {
      try {
        const [y, m, d] = newBs.split('-');
        const adResult = converter.bs2ad(`${y}/${m}/${d}`);
        setAdDate(`${adResult.year}-${String(adResult.month).padStart(2, '0')}-${String(adResult.day).padStart(2, '0')}`);
      } catch (err) {
        console.error('BS to AD conversion failed', err);
      }
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ppPhoto, setPpPhoto] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ppInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePpSelect = () => {
    ppInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPpPhoto(e.target.files[0]);
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitted(true);
      // Optional: Navigate after a delay or let user click a button
       setTimeout(() => {
          navigate('/');
       }, 5000); // Auto redirect after 5s or just let them read
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center py-12 px-4 font-sans">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">KYC Sent for Verification</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            Our admin will review your submission and work accordingly. This usually takes <span className="font-bold">24-72 hours</span>.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center py-12 px-4 font-sans relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center space-x-2 text-slate-600 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Go to Home</span>
      </button>

      {/* Container */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 relative overflow-hidden mt-12">
        {/* Dark Mode Toggle (Visual Only) */}
        <div className="absolute top-8 right-8">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
            <motion.div whileTap={{ scale: 0.9 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </motion.div>
          </div>
        </div>

        <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-blue-600 mb-1 font-display tracking-tight">
             Aincho <span className="ml-[2px]">Paincho</span>
            </h1>
            <h2 className="text-lg font-bold text-slate-700">KYC Verification</h2>
        </div>



        {/* Stepper */}
        <div className="flex items-center justify-between mb-16 relative px-4">
          <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 -z-0">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(step - 1) * 50}%` }}
               className="h-full bg-blue-600 transition-all duration-500"
             />
          </div>
          
          {[
            { id: 1, label: 'Personal Info' },
            { id: 2, label: 'Documents' },
            { id: 3, label: 'Verification' }
          ].map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  s.id === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 
                  s.id < step ? 'bg-blue-600 text-white' : 'bg-[#E5E7EB] text-slate-400'
                }`}
              >
                {s.id < step ? '✓' : s.id}
              </div>
              <span className={`text-[11px] font-bold mt-2 uppercase tracking-wider whitespace-nowrap ${
                s.id <= step ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleNext} className="space-y-10">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h3 className="text-2xl font-extrabold text-[#1E293B]">Personal Information</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name (as per document) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="E.g., Ram Bahadur Thapa"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Date of Birth (AD / ईस्वी) <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={adDate}
                      onChange={handleAdChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Date of Birth (BS / वि.सं.) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={bsDate}
                      onChange={handleBsChange}
                      placeholder="E.g., 2055-05-15"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg flex items-start space-x-3 border border-slate-100">
                  <span className="text-slate-600 text-xs leading-relaxed">
                    <span className="font-bold">Note:</span> Enter BS date in YYYY-MM-DD format (e.g., 2055-05-15 for Shrawan 15, 2055)
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Gender <span className="text-red-500">*</span></label>
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-all appearance-none cursor-pointer shadow-sm"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-extrabold text-[#1E293B]">Current Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Province <span className="text-red-500">*</span></label>
                    <select
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-all shadow-sm"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="1">Province No. 1</option>
                      <option value="2">Madhesh Province</option>
                      <option value="3">Bagmati Province</option>
                      <option value="4">Gandaki Province</option>
                      <option value="5">Lumbini Province</option>
                      <option value="6">Karnali Province</option>
                      <option value="7">Sudurpashchim Province</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">District <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="E.g., Kathmandu"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Municipality <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="E.g., Kathmandu Metropolitan"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Ward No. <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="E.g., 10"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tole/Street</label>
                  <input
                    type="text"
                    placeholder="E.g., Putalisadak"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h3 className="text-2xl font-extrabold text-[#1E293B]">Document Verification</h3>
                
                {/* PP Size Photo Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Passport Size Photo <span className="text-red-500">*</span></label>
                  <input 
                    type="file" 
                    ref={ppInputRef} 
                    onChange={handlePpChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <div 
                    onClick={handlePpSelect}
                    className={`p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${
                      ppPhoto 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 bg-slate-50 hover:border-blue-400'
                    }`}
                  >
                    {ppPhoto ? (
                      <div className="relative w-24 h-24 mb-2">
                        <img 
                          src={URL.createObjectURL(ppPhoto)} 
                          alt="PP Preview" 
                          className="w-full h-full object-cover rounded-lg shadow-sm border border-blue-200"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                    )}
                    <div>
                      {ppPhoto ? (
                        <div>
                          <p className="font-bold text-blue-700 text-sm">{ppPhoto.name}</p>
                          <p className="text-blue-500 text-xs mt-1">Click to change</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-700 text-sm">Upload Photo</p>
                          <p className="text-slate-400 text-[10px] mt-1">Recent PP size photo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Citizenship Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Citizenship / Passport <span className="text-red-500">*</span></label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                
                <div 
                  onClick={handleFileSelect}
                  className={`p-12 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer group ${
                    selectedFile 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 bg-slate-50 hover:border-blue-400'
                  }`}
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    {selectedFile ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    )}
                  </div>
                  <div>
                    {selectedFile ? (
                      <div>
                        <p className="font-bold text-blue-700">{selectedFile.name}</p>
                        <p className="text-blue-500 text-xs mt-1">Click to change</p>
                      </div>
                    ) : (
                      <p className="font-bold text-slate-700">Upload Citizenship / Passport</p>
                    )}
                  </div>
                  <p className="text-red-500 font-medium text-xs mt-4 bg-red-50 inline-block px-3 py-1 rounded-full border border-red-100">
                    For citizenship upload, make sure both sides are visible in the same photo
                  </p>
                  {!selectedFile && <p className="text-slate-400 text-xs mt-2">Maximum file size: 5MB</p>}
                </div>
              </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10 text-center py-12"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-3xl font-black text-slate-800">All Set!</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Your details have been recorded. Press complete to start sharing and renting.</p>
            </motion.div>
          )}

          <div className="flex items-center justify-end pt-8 border-t border-slate-100">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-lg shadow-blue-600/20 active:translate-y-0.5"
            >
              <span>{step === 3 ? 'Complete' : 'Next'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KYC;
