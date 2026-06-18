import React, { useState } from 'react';
import { 
  Megaphone, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Languages, 
  Copy, 
  Check, 
  Sparkles, 
  FileText 
} from 'lucide-react';

const BN_MONTHS = ['', 'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const EN_MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const D_MAP: { [key: string]: string } = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

function toBn(n: string | number): string {
  return String(n).replace(/[0-9]/g, d => D_MAP[d] || d);
}

function ordinal(n: number) {
  if (n > 3 && n < 21) return n + 'th';
  switch (n % 10) {
    case 1:  return n + "st";
    case 2:  return n + "nd";
    case 3:  return n + "rd";
    default: return n + "th";
  }
}

function getTimeLabelBn(hour: string, ampm: string): string {
  const h = parseInt(hour, 10);
  if (isNaN(h)) return '';
  if (ampm === 'AM') {
    return h >= 5 ? 'সকাল' : 'রাত';
  } else {
    if (h === 12) return 'দুপুর';
    if (h <= 3) return 'দুপুর';
    if (h <= 6) return 'বিকাল';
    if (h <= 8) return 'সন্ধ্যা';
    return 'রাত';
  }
}

const MODE_BN = { online: 'অনলাইনে', offline: 'অফলাইনে', classroom: 'ক্লাসরুমে সরাসরি' };
const MODE_EN = { online: 'Online', offline: 'Offline', classroom: 'In-person (Classroom)' };

export default function NoticeGenerator() {
  // Get today's default date in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [dateVal, setDateVal] = useState(today);
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [modeKey, setModeKey] = useState<'online' | 'offline' | 'classroom'>('online');
  const [topicBn, setTopicBn] = useState('');
  const [topicEn, setTopicEn] = useState('');

  // Generated notices
  const [generatedBn, setGeneratedBn] = useState('');
  const [generatedEn, setGeneratedEn] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'bn' | 'en'>('bn');

  // Copy success states
  const [copiedBn, setCopiedBn] = useState(false);
  const [copiedEn, setCopiedEn] = useState(false);

  const handleGenerate = () => {
    if (!dateVal) {
      alert('দয়া করে একটি সঠিক তারিখ নির্বাচন করুন।\nPlease select a valid date.');
      return;
    }
    if (!hour) {
      alert('দয়া করে ঘণ্টা নির্বাচন করুন।\nPlease select an hour.');
      return;
    }

    const [year, monthStr, dayStr] = dateVal.split('-').map(Number);
    const day = dayStr || 1;
    const month = monthStr || 1;

    const currentTopicBn = topicBn.trim() || 'সফটওয়্যার ট্রেনিং';
    const currentTopicEn = topicEn.trim() || 'Software Training';

    // Bengali notice formatting
    const bnMin = minute !== '00' ? `:${toBn(minute)}` : '';
    const bnLabel = getTimeLabelBn(hour, ampm);
    const bnTime = `${bnLabel} ${toBn(hour)}${bnMin}:০০ টায়`;
    const bnText = `${toBn(day)} ${BN_MONTHS[month]} ${bnTime} ${MODE_BN[modeKey]} ${currentTopicBn} অনুষ্ঠিত হবে। উক্ত ট্রেনিংয়ে নির্ধারিত সময়ে আপনার অংশগ্রহণের জন্য বিনীত অনুরোধ রইলো। আপনার উপস্থিতি আমাদের জন্য অত্যন্ত মূল্যবান।`;

    // English notice formatting
    const enMin = minute !== '00' ? `:${minute}` : ':00';
    const enTime = `${hour}${enMin} ${ampm}`;
    const enText = `${MODE_EN[modeKey]} ${currentTopicEn} will be held on ${ordinal(day)} ${EN_MONTHS[month]} at ${enTime}. You are requested to join the training at the scheduled time.`;

    setGeneratedBn(bnText);
    setGeneratedEn(enText);
    setIsVisible(true);

    // Reset copy indicator states
    setCopiedBn(false);
    setCopiedEn(false);
  };

  const handleCopy = (lang: 'bn' | 'en') => {
    const textToCopy = lang === 'bn' ? generatedBn : generatedEn;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (lang === 'bn') {
          setCopiedBn(true);
          setTimeout(() => setCopiedBn(false), 2000);
        } else {
          setCopiedEn(true);
          setTimeout(() => setCopiedEn(false), 2000);
        }
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        if (lang === 'bn') {
          setCopiedBn(true);
          setTimeout(() => setCopiedBn(false), 2000);
        } else {
          setCopiedEn(true);
          setTimeout(() => setCopiedEn(false), 2000);
        }
      } catch (err) {
        alert('কপি করতে পারেনি। অনুগ্রহ করে টেক্সটটি সিলেক্ট করে ম্যানুয়ালি কপি করুন।');
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Upper Module header section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Megaphone className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              📢 Notice Generator
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Selection / inputs panel */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              Notice Details
            </h2>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} />
                Date
              </label>
              <style>{`
                .custom-date-input::-webkit-calendar-picker-indicator {
                  filter: invert(0.3) brightness(1);
                  cursor: pointer;
                }
                .dark .custom-date-input::-webkit-calendar-picker-indicator {
                  filter: invert(1) brightness(2);
                }
              `}</style>
              <input 
                type="date" 
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="custom-date-input w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Time Hour Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} />
                Time (Hour & Minutes)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">Hour</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>

                <select 
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="00">:00</option>
                  <option value="15">:15</option>
                  <option value="30">:30</option>
                  <option value="45">:45</option>
                </select>
              </div>
            </div>

            {/* AM / PM Option */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                AM / PM Indicator
              </label>
              <select 
                value={ampm}
                onChange={(e) => setAmpm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="AM">AM (Morning / সকাল)</option>
                <option value="PM">PM (Afternoon / Evening / দুপুর - বিকাল - রাত)</option>
              </select>
            </div>

            {/* Mode Option */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={12} />
                Mode
              </label>
              <select 
                value={modeKey}
                onChange={(e) => setModeKey(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="online">Online (অনলাইনে)</option>
                <option value="offline">Offline (অফলাইনে)</option>
                <option value="classroom">Classroom (ক্লাসরুমে সরাসরি)</option>
              </select>
            </div>

            {/* Topic (Bengali) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <BookOpen size={12} />
                Topic (Bengali)
              </label>
              <input 
                type="text" 
                value={topicBn}
                onChange={(e) => setTopicBn(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Topic (English) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <BookOpen size={12} />
                Topic (English)
              </label>
              <input 
                type="text" 
                value={topicEn}
                onChange={(e) => setTopicEn(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Generate Trigger */}
            <button 
              onClick={handleGenerate}
              className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className="animate-pulse" />
              ✨ Generate Notice
            </button>

          </div>
        </div>

        {/* Output Presentation section */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  Generated Outputs
                </span>
                
                {isVisible && (
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    <button
                      onClick={() => setActiveTab('bn')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${activeTab === 'bn' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      বাংলা নোটিশ
                    </button>
                    <button
                      onClick={() => setActiveTab('en')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${activeTab === 'en' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              {!isVisible ? (
                <div className="py-24 text-center text-slate-400 dark:text-slate-600 space-y-2">
                  <Languages size={40} className="mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Notice Generated Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Fill out the parameters on the left and hit "Generate Notice".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Language specific layouts */}
                  {activeTab === 'bn' ? (
                    <div className="p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/5 dark:bg-indigo-950/5 relative overflow-hidden transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-indigo-600" />
                      <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
                        বাংলা সংস্করণ
                      </span>
                      <p className="text-[15px] leading-8 font-medium text-slate-800 dark:text-slate-200 text-justify">
                        {generatedBn}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/5 dark:bg-emerald-950/5 relative overflow-hidden transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-lime-400 to-green-500" />
                      <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full mb-4">
                        English Notice Output
                      </span>
                      <p className="text-[14px] leading-7 font-medium text-slate-800 dark:text-slate-200 text-justify">
                        {generatedEn}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isVisible && (
              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                {activeTab === 'bn' ? (
                  <button
                    onClick={() => handleCopy('bn')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border shadow-sm transition-all ${
                      copiedBn
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 text-white border-indigo-600'
                    }`}
                  >
                    {copiedBn ? (
                      <>
                        <Check size={13} className="stroke-[3]" />
                        কপি হয়েছে!
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        📋 বাংলা কপি করুন
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCopy('en')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border shadow-sm transition-all ${
                      copiedEn
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 text-white border-emerald-600'
                    }`}
                  >
                    {copiedEn ? (
                      <>
                        <Check size={13} className="stroke-[3]" />
                        Copied successfully!
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        📋 Copy English
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
