import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, Music, PlusCircle, X, Eraser } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import * as htmlToImage from 'html-to-image';

// Chord suggestions for common scales
const scaleChords = {
  'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'G7'],
  'Cm': ['Cm', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'G'],
  'C#': ['C#', 'D#m', 'Fm', 'F#', 'G#', 'A#m'],
  'C#m': ['C#m', 'E', 'F#m', 'G#m', 'A', 'B', 'G#'],
  'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'A7'],
  'Dm': ['Dm', 'F', 'Gm', 'Am', 'Bb', 'C', 'A'],
  'Eb': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Bb7'],
  'Ebm': ['Ebm', 'Gb', 'Abm', 'Bbm', 'B', 'Db', 'Bb'],
  'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'B7'],
  'Em': ['Em', 'G', 'Am', 'Bm', 'C', 'D', 'B'],
  'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'C7'],
  'Fm': ['Fm', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'C'],
  'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m'],
  'F#m': ['F#m', 'A', 'Bm', 'C#m', 'D', 'E', 'C#'],
  'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'D7'],
  'Gm': ['Gm', 'Bb', 'Cm', 'Dm', 'Eb', 'F', 'D'],
  'Ab': ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm'],
  'G#m': ['G#m', 'B', 'C#m', 'D#m', 'E', 'F#', 'D#'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'E7'],
  'Am': ['Am', 'C', 'Dm', 'Em', 'F', 'G', 'E'],
  'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'F7'],
  'Bbm': ['Bbm', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'F'],
  'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'F#7'],
  'Bm': ['Bm', 'D', 'Em', 'F#m', 'G', 'A', 'F#'],
};

const defaultChords = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];

const defaultSections = [
  { id: '1', name: 'Intro', rows: [['', '', '', '']] },
  { id: '2', name: 'Chorus', rows: [['', '', '', '']] },
  { id: '3', name: 'Inter', rows: [['', '', '', '']] },
  { id: '4', name: 'Verse', rows: [['', '', '', '']] },
];

export default function App() {
  const [songName, setSongName] = useState(() => localStorage.getItem('chordBox_songName') || '');
  const [songScale, setSongScale] = useState(() => localStorage.getItem('chordBox_songScale') || '');
  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('chordBox_sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultSections;
      }
    }
    return defaultSections;
  });

  const [activeCell, setActiveCell] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const printRef = useRef(null);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('chordBox_songName', songName);
  }, [songName]);

  useEffect(() => {
    localStorage.setItem('chordBox_songScale', songScale);
  }, [songScale]);

  useEffect(() => {
    localStorage.setItem('chordBox_sections', JSON.stringify(sections));
  }, [sections]);

  const updateChord = (sectionId, rowIndex, colIndex, value) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = [...sec.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];

      // Auto-capitalize first letter if typing manually
      let formattedValue = value;
      if (value.length === 1) {
        formattedValue = value.toUpperCase();
      }

      newRows[rowIndex][colIndex] = formattedValue;
      return { ...sec, rows: newRows };
    }));
  };

  const addRow = (sectionId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, rows: [...sec.rows, ['', '', '', '']] };
    }));
  };

  const removeRow = (sectionId, rowIndex) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = sec.rows.filter((_, i) => i !== rowIndex);
      // Ensure at least one row remains
      return { ...sec, rows: newRows.length > 0 ? newRows : [['', '', '', '']] };
    }));
  };

  const updateSectionName = (sectionId, newName) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, name: newName };
    }));
  };

  const addNewSection = () => {
    const newId = Date.now().toString();
    setSections(prev => [...prev, { id: newId, name: 'New Part', rows: [['', '', '', '']] }]);
    toast.success("New section added successfully!");
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all chords and start over?")) {
      setSongName('');
      setSongScale('');
      setSections(defaultSections);
      toast.success("All fields have been cleared!");
    }
  };

  const handleSave = async () => {
    if (!printRef.current) return;

    setActiveCell(null);
    setIsCapturing(true);

    toast.info("Generating A4 JPG. Please wait...", { id: "saving-toast" });

    setTimeout(async () => {
      try {
        const dataUrl = await htmlToImage.toJpeg(printRef.current, {
          quality: 1.0,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = songName ? `${songName}-chords.jpg` : 'ChordBox-Sheet.jpg';
        link.href = dataUrl;
        link.click();

        toast.success("A4 Chord sheet saved successfully!", {
          id: "saving-toast",
          icon: <Save className="w-4 h-4" />
        });
      } catch (error) {
        console.error(error);
        toast.error(`Failed to save: ${error.message || 'Unknown error'}`, { id: "saving-toast" });
      } finally {
        setIsCapturing(false);
      }
    }, 150);
  };

  const currentSuggestions = songScale && scaleChords[songScale]
    ? scaleChords[songScale]
    : defaultChords;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans sm:py-6 relative">
      <Toaster position="top-center" />

      {/* Main Interactive App Container */}
      <div
        className="w-full max-w-md md:max-w-3xl bg-white sm:rounded-[2rem] sm:shadow-2xl relative flex flex-col border-slate-200 border-t-0 sm:border-8 min-h-screen sm:min-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white pt-10 pb-5 px-6 rounded-b-3xl shadow-lg relative z-10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music size={24} className="text-blue-100" />
              <h1 className="text-2xl font-extrabold tracking-tight">ChordBox</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={handleClear} disabled={isCapturing} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all text-white" title="Clear All">
                <Eraser size={18} />
              </button>
              <button onClick={handleSave} disabled={isCapturing} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all text-white disabled:opacity-50" title="Save as JPG">
                <Save size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Song Title..."
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="flex-1 bg-black/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium text-lg shadow-inner min-w-0"
            />

            <div className="relative shrink-0">
              <select
                value={songScale}
                onChange={(e) => setSongScale(e.target.value)}
                className="w-full md:w-32 bg-black/10 border border-white/20 rounded-xl px-2 py-3 text-white focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-bold text-lg shadow-inner appearance-none text-center cursor-pointer h-full"
              >
                <option value="" className="text-slate-800 font-normal">Scale</option>
                {Object.keys(scaleChords).map(k => (
                  <option key={k} value={k} className="text-slate-800 font-bold">{k}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div
          className="flex-1 px-4 md:px-8 py-6 space-y-6 scroll-smooth overflow-y-auto pb-40"
          onClick={() => setActiveCell(null)}
        >
          {sections.map((section) => (
            <div key={section.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm relative group" onClick={e => e.stopPropagation()}>
              {/* Section Header */}
              <div className="flex justify-between items-center mb-4">
                <input
                  value={section.name}
                  onChange={(e) => updateSectionName(section.id, e.target.value)}
                  className="font-bold text-slate-800 text-lg md:text-xl bg-transparent outline-none w-32 md:w-48 focus:border-b-2 focus:border-indigo-500 transition-colors"
                />
                
                <button
                  onClick={() => addRow(section.id)}
                  className="text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg text-sm md:text-base font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={16} strokeWidth={3} /> Add Row
                </button>
              </div>

              {/* Grid of Boxes */}
              <div className="space-y-3 md:space-y-4">
                {section.rows.map((row, rIndex) => (
                  <div key={rIndex} className="flex gap-2 md:gap-4 items-center relative w-full">
                    <div className="grid grid-cols-4 gap-2 md:gap-4 flex-1">
                      {row.map((chord, cIndex) => {
                        const isActive = activeCell?.sec === section.id && activeCell?.r === rIndex && activeCell?.c === cIndex;
                        return (
                          <div key={cIndex} className="relative w-full pt-[100%] sm:pt-0 sm:h-24 md:h-28">
                            <input
                              value={chord}
                              onFocus={() => setActiveCell({ sec: section.id, r: rIndex, c: cIndex })}
                              onChange={(e) => updateChord(section.id, rIndex, cIndex, e.target.value)}
                              className={`absolute inset-0 w-full h-full text-center text-xl sm:text-2xl md:text-3xl font-black rounded-xl border-2 outline-none transition-all shadow-inner bg-white ${isActive ? 'border-indigo-500 ring-4 ring-indigo-500/20 text-indigo-700' : 'border-slate-200 focus:border-indigo-400 text-slate-700'} placeholder:text-slate-300 placeholder:font-normal`}
                              maxLength={7}
                              placeholder="-"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Delete Row Button */}
                    <div className="w-8 md:w-10 flex justify-center shrink-0">
                      {section.rows.length > 1 ? (
                        <button
                          onClick={() => removeRow(section.id, rIndex)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 md:p-3 rounded-full transition-colors"
                          title="Delete Row"
                        >
                          <Trash2 size={20} className="md:w-6 md:h-6" />
                        </button>
                      ) : (
                        <div className="w-8 md:w-10"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add Section Button */}
          <div className="pt-2 md:pt-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={addNewSection}
              className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 py-4 md:py-6 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all hover:bg-indigo-50/50 md:text-lg"
            >
              <PlusCircle size={20} className="md:w-6 md:h-6" /> Add New Section
            </button>
          </div>
        </div>

        {/* Chord Suggestions Floating Bar */}
        {activeCell && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-50 p-3 pb-6 sm:pb-3 animate-in slide-in-from-bottom-6 duration-300 rounded-b-[2rem] sm:rounded-b-[1.5rem]">
            <div className="flex items-center justify-between mb-3 px-1 md:px-4">
              <span className="text-sm md:text-base font-bold text-slate-600 flex items-center gap-2">
                {songScale ? (
                  <>Scale: <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">{songScale}</span> Chords</>
                ) : 'Suggested Chords'}
              </span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveCell(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex overflow-x-auto gap-2.5 pb-2 md:px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {currentSuggestions.map(chord => (
                <button
                  key={chord}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    if (activeCell) updateChord(activeCell.sec, activeCell.r, activeCell.c, chord);
                  }}
                  className="shrink-0 bg-white border-2 border-indigo-100 text-indigo-700 font-extrabold px-5 py-3 md:px-8 md:py-4 md:text-xl rounded-xl hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all text-lg shadow-sm"
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* A4 Print Container - Visible dynamically to ensure valid rendering bounds */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pb-20"
        style={{ 
          opacity: isCapturing ? 1 : 0, 
          pointerEvents: 'none', 
          zIndex: isCapturing ? 50 : -50,
          visibility: isCapturing ? 'visible' : 'hidden'
        }}
      >
        <div 
          ref={printRef} 
          className="flex flex-col"
          style={{ width: '794px', minHeight: '1123px', padding: '60px 40px', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
        >
          {/* Print Header */}
          <div className="text-center mb-10 border-b-2 pb-8" style={{ borderColor: '#e2e8f0' }}>
            <h1 className="text-5xl font-extrabold mb-3" style={{ color: '#1e293b', fontFamily: 'sans-serif' }}>{songName || 'Untitled Song'}</h1>
            {songScale && <p className="text-2xl font-semibold" style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Key: {songScale}</p>}
          </div>

          {/* Print Chords Content */}
          <div className="space-y-10 flex-1">
            {sections.map((section) => {
              // Only print sections that have at least one chord
              const hasChords = section.rows.some(row => row.some(chord => chord.trim() !== ''));
              if (!hasChords) return null;

              return (
                <div key={section.id} className="mb-8 page-break-inside-avoid">
                  <h2 className="text-3xl font-bold mb-5" style={{ color: '#334155', fontFamily: 'sans-serif' }}>{section.name}</h2>
                  <div className="space-y-3">
                    {section.rows.map((row, rIndex) => (
                      <div key={rIndex} className="grid grid-cols-4 gap-4">
                        {row.map((chord, cIndex) => (
                          <div 
                            key={cIndex} 
                            className="border-2 rounded-xl h-24 flex items-center justify-center text-4xl font-extrabold"
                            style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#1e293b', fontFamily: 'sans-serif' }}
                          >
                            {chord || ''}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center font-medium text-lg" style={{ color: '#94a3b8', fontFamily: 'sans-serif' }}>
            Created with ChordBox
          </div>
        </div>
      </div>
    </div>
  );
}
