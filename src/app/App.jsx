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
  'Abm': ['Abm', 'B', 'C#m', 'D#m', 'E', 'F#', 'D#'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'E7'],
  'Am': ['Am', 'C', 'Dm', 'Em', 'F', 'G', 'E'],
  'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'F7'],
  'Bbm': ['Bbm', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'F'],
  'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'F#7'],
  'Bm': ['Bm', 'D', 'Em', 'F#m', 'G', 'A', 'F#'],
};

const defaultChords = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];

const emptyCell = () => ({ chord: '', repeatStart: false, repeatEnd: false });

const defaultSections = [
  { id: '1', name: 'Intro', rows: [[emptyCell(), emptyCell(), emptyCell(), emptyCell()]] },
  { id: '2', name: 'Chorus', rows: [[emptyCell(), emptyCell(), emptyCell(), emptyCell()]] },
  { id: '3', name: 'Inter', rows: [[emptyCell(), emptyCell(), emptyCell(), emptyCell()]] },
  { id: '4', name: 'Verse', rows: [[emptyCell(), emptyCell(), emptyCell(), emptyCell()]] },
];

export default function App() {
  const [songName, setSongName] = useState(() => localStorage.getItem('chordBox_songName') || '');
  const [songScale, setSongScale] = useState(() => localStorage.getItem('chordBox_songScale') || '');
  const [timeSignature, setTimeSignature] = useState(() => localStorage.getItem('chordBox_timeSig') || '');

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('chordBox_sections');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        // Migration from old string format
        return parsed.map(sec => ({
          ...sec,
          rows: sec.rows.map(row =>
            row.map(cell => typeof cell === 'string'
              ? { chord: cell, repeatStart: false, repeatEnd: false }
              : cell
            )
          )
        }));
      } catch (e) {
        return defaultSections;
      }
    }
    return defaultSections;
  });

  const [activeCell, setActiveCell] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const printRef = useRef(null);

  const [transposeCount, setTransposeCount] = useState(() => {
    return parseInt(localStorage.getItem('chordBox_transpose') || '0', 10);
  });

  // Sync states to local storage
  useEffect(() => {
    localStorage.setItem('chordBox_songName', songName);
  }, [songName]);

  useEffect(() => {
    localStorage.setItem('chordBox_songScale', songScale);
  }, [songScale]);

  useEffect(() => {
    localStorage.setItem('chordBox_timeSig', timeSignature);
  }, [timeSignature]);

  useEffect(() => {
    localStorage.setItem('chordBox_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('chordBox_transpose', transposeCount.toString());
  }, [transposeCount]);

  const updateChord = (sectionId, rowIndex, colIndex, value) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = [...sec.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];

      let formattedValue = value;
      if (value.length === 1) {
        formattedValue = value.toUpperCase();
      }

      newRows[rowIndex][colIndex] = { ...newRows[rowIndex][colIndex], chord: formattedValue };
      return { ...sec, rows: newRows };
    }));
  };

  const toggleRepeat = (sectionId, rowIndex, colIndex, type) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = [...sec.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];

      newRows[rowIndex][colIndex] = {
        ...newRows[rowIndex][colIndex],
        [type]: !newRows[rowIndex][colIndex][type]
      };
      return { ...sec, rows: newRows };
    }));
  };

  const addRow = (sectionId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, rows: [...sec.rows, [emptyCell(), emptyCell(), emptyCell(), emptyCell()]] };
    }));
  };

  const removeRow = (sectionId, rowIndex) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = sec.rows.filter((_, i) => i !== rowIndex);
      return { ...sec, rows: newRows.length > 0 ? newRows : [[emptyCell(), emptyCell(), emptyCell(), emptyCell()]] };
    }));
  };

  const removeCell = (sectionId, rowIndex, colIndex) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = [...sec.rows];
      newRows[rowIndex] = newRows[rowIndex].filter((_, i) => i !== colIndex);
      if (newRows[rowIndex].length === 0) {
        newRows[rowIndex] = [emptyCell()];
      }
      return { ...sec, rows: newRows };
    }));
  };

  const addCell = (sectionId, rowIndex) => {
    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRows = [...sec.rows];
      newRows[rowIndex] = [...newRows[rowIndex], emptyCell()];
      return { ...sec, rows: newRows };
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
    setSections(prev => [...prev, { id: newId, name: 'New Part', rows: [[emptyCell(), emptyCell(), emptyCell(), emptyCell()]] }]);
    toast.success("New section added successfully!");
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all chords and start over?")) {
      setSongName('');
      setSongScale('');
      setTimeSignature('');
      setSections(defaultSections);
      setTransposeCount(0);
      toast.success("All fields have been cleared!");
    }
  };

  const handleTranspose = (steps) => {
    const NOTE_TO_INDEX = {
      'C': 0, 'B#': 0,
      'C#': 1, 'Db': 1,
      'D': 2,
      'D#': 3, 'Eb': 3,
      'E': 4, 'Fb': 4,
      'F': 5, 'E#': 5,
      'F#': 6, 'Gb': 6,
      'G': 7,
      'G#': 8, 'Ab': 8,
      'A': 9,
      'A#': 10, 'Bb': 10,
      'B': 11, 'Cb': 11
    };
    const INDEX_TO_NOTE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

    if (songScale) {
      const match = songScale.match(/^([A-G][b#]?)(.*)$/);
      if (match) {
        let index = NOTE_TO_INDEX[match[1]];
        if (index !== undefined) {
          let newIndex = (index + steps) % 12;
          if (newIndex < 0) newIndex += 12;
          setSongScale(INDEX_TO_NOTE[newIndex] + match[2]);
        }
      }
    }

    setSections(prev => prev.map(sec => ({
      ...sec,
      rows: sec.rows.map(row => row.map(cell => {
        if (!cell.chord) return cell;

        const newChord = cell.chord.split('/').map(part => {
          const m = part.trim().match(/^([A-G][b#]?)(.*)$/);
          if (!m) return part;
          let index = NOTE_TO_INDEX[m[1]];
          if (index === undefined) return part;
          
          let newIndex = (index + steps) % 12;
          if (newIndex < 0) newIndex += 12;
          return INDEX_TO_NOTE[newIndex] + m[2];
        }).join('/');

        return { ...cell, chord: newChord };
      }))
    })));

    setTransposeCount(prev => prev + steps);
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

  // Active cell data helper
  const getActiveCellData = () => {
    if (!activeCell) return null;
    const sec = sections.find(s => s.id === activeCell.sec);
    if (!sec) return null;
    return sec.rows[activeCell.r][activeCell.c];
  };

  // Calculate dynamic sizing for precise A4 print mapping
  const numValidSecs = sections.filter(sec => sec.rows.some(r => r.some(c => c.chord?.trim() !== ''))).length;
  const numValidRows = sections.reduce((acc, sec) => {
    const hasChords = sec.rows.some(r => r.some(c => c.chord?.trim() !== ''));
    return acc + (hasChords ? sec.rows.length : 0);
  }, 0);

  const printGapValue = 8;
  const printMbValue = 24;
  
  const numGapsBetweenRows = Math.max(0, numValidRows - numValidSecs);
  const numGapsBetweenSections = Math.max(0, numValidSecs - 1);
  
  const fixedSpace = (numValidSecs * 30) + (numGapsBetweenSections * printMbValue) + (numGapsBetweenRows * printGapValue);
  
  // Available height for just the boxes (950 is safe space from 1123 A4 height minus header/footer)
  const availableForBoxes = Math.max(100, 950 - fixedSpace);
  
  let calculatedBoxHeight = Math.floor(availableForBoxes / (numValidRows || 1));
  calculatedBoxHeight = Math.max(12, Math.min(90, calculatedBoxHeight));

  const printBoxHeight = `${calculatedBoxHeight}px`;
  // Make text size bigger relative to the box (0.55 multiplier instead of 0.45)
  const printTextSize = `${Math.max(12, Math.min(48, Math.floor(calculatedBoxHeight * 0.55)))}px`;
  
  const printGap = `${printGapValue}px`;
  const printMb = `${printMbValue}px`;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans sm:py-6 relative">
      <Toaster position="top-center" />

      {/* Main Interactive App Container */}
      <div
        className="w-full max-w-md md:max-w-3xl bg-white sm:rounded-[2rem] sm:shadow-2xl relative flex flex-col border-slate-200 border-t-0 sm:border-8 h-screen sm:h-[90vh] overflow-hidden"
      >
        {/* Content Body wrapper that handles all scrolling */}
        <div
          className="flex-1 scroll-smooth overflow-y-auto pb-48 flex flex-col"
          onClick={() => setActiveCell(null)}
        >
          {/* Header (Now inside the scroller so it scrolls with the page) */}
          <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white pt-10 pb-5 px-4 md:px-6 rounded-b-3xl shadow-lg relative z-10 shrink-0">
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

              <div className="flex flex-row gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <select
                  value={songScale}
                  onChange={(e) => setSongScale(e.target.value)}
                  className="shrink-0 w-[4.5rem] md:w-24 bg-black/10 border border-white/20 rounded-xl px-2 py-3 text-white focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-bold text-base md:text-lg shadow-inner appearance-none text-center cursor-pointer"
                >
                  <option value="" className="text-slate-800 font-normal">Key</option>
                  {Object.keys(scaleChords).map(k => (
                    <option key={k} value={k} className="text-slate-800 font-bold">{k}</option>
                  ))}
                </select>

                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="shrink-0 w-[4.5rem] md:w-20 bg-black/10 border border-white/20 rounded-xl px-2 py-3 text-white focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-bold text-base md:text-lg shadow-inner appearance-none text-center cursor-pointer"
                >
                  <option value="" className="text-slate-800 font-normal">Time</option>
                  {['2/4', '3/4', '4/4', '6/8'].map(k => (
                    <option key={k} value={k} className="text-slate-800 font-bold">{k}</option>
                  ))}
                </select>

                {/* Transpose Controls */}
                <div className="shrink-0 flex items-stretch bg-black/10 border border-white/20 rounded-xl text-white shadow-inner">
                  <button 
                    onClick={() => handleTranspose(-1)} 
                    disabled={isCapturing}
                    className="px-3 md:px-4 hover:bg-white/20 rounded-l-xl transition-colors font-bold text-2xl flex items-center justify-center disabled:opacity-50"
                  >
                    <span className="-mt-1">-</span>
                  </button>
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem] px-1 pointer-events-none border-x border-white/10">
                    <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider mb-0.5" style={{ fontSize: '9px' }}>Transp</span>
                    <span className="font-bold text-sm leading-none">{transposeCount > 0 ? `+${transposeCount}` : transposeCount}</span>
                  </div>
                  <button 
                    onClick={() => handleTranspose(1)} 
                    disabled={isCapturing}
                    className="px-3 md:px-4 hover:bg-white/20 rounded-r-xl transition-colors font-bold text-xl flex items-center justify-center disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 md:px-8 py-6 space-y-6">
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
                        {row.map((cell, cIndex) => {
                          const isActive = activeCell?.sec === section.id && activeCell?.r === rIndex && activeCell?.c === cIndex;
                          return (
                            <div key={cIndex} className="relative w-full aspect-square sm:aspect-auto sm:h-24 md:h-28 group/cell">
                              <div className={`absolute inset-0 w-full h-full flex items-center justify-between px-1 md:px-4 rounded-xl border-2 transition-all shadow-inner bg-white ${isActive ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200 focus-within:border-indigo-400'}`}>

                                {/* Left Repeat Bracket */}
                                {cell.repeatStart && (
                                  <div className="flex justify-center shrink-0 pr-1 md:pr-2">
                                    <span className="text-lg sm:text-2xl md:text-4xl font-extrabold text-slate-800 select-none">[</span>
                                  </div>
                                )}

                                <input
                                  value={cell.chord}
                                  onFocus={() => setActiveCell({ sec: section.id, r: rIndex, c: cIndex })}
                                  onChange={(e) => updateChord(section.id, rIndex, cIndex, e.target.value)}
                                  className={`flex-1 w-full min-w-0 px-0 text-center text-[17px] sm:text-2xl md:text-3xl font-black outline-none bg-transparent ${isActive ? 'text-indigo-700' : 'text-slate-700'} placeholder:text-slate-300 placeholder:font-normal`}
                                  maxLength={7}
                                  placeholder="-"
                                />

                                {/* Right Repeat Bracket */}
                                {cell.repeatEnd && (
                                  <div className="flex justify-center shrink-0 pl-1 md:pl-2">
                                    <span className="text-lg sm:text-2xl md:text-4xl font-extrabold text-slate-800 select-none">]</span>
                                  </div>
                                )}

                              </div>
                              
                              {/* Remove Cell Button */}
                              {row.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCell(section.id, rIndex, cIndex);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover/cell:opacity-100 transition-all z-10 shadow-sm border border-white"
                                  title="Remove Box"
                                >
                                  <X size={12} strokeWidth={3} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Row Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => addCell(section.id, rIndex)}
                          className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 md:p-2 rounded-full transition-colors flex justify-center"
                          title="Add Box to Row"
                        >
                          <Plus size={18} className="md:w-5 md:h-5" />
                        </button>
                        
                        {section.rows.length > 1 ? (
                          <button
                            onClick={() => removeRow(section.id, rIndex)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 md:p-2 rounded-full transition-colors flex justify-center"
                            title="Delete Row"
                          >
                            <Trash2 size={18} className="md:w-5 md:h-5" />
                          </button>
                        ) : (
                          <div className="h-[30px] md:h-[36px]"></div>
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
        </div>

        {/* Floating Bar with Chords & Repeat Controls */}
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

            <div className="flex items-center">
              <div className="flex flex-1 overflow-x-auto gap-2.5 pb-2 md:px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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

              {/* Repeat Syntax Toggles */}
              <div className="flex gap-2 pl-3 ml-3 border-l-2 border-indigo-100 shrink-0 self-start">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleRepeat(activeCell.sec, activeCell.r, activeCell.c, 'repeatStart');
                  }}
                  className={`border-2 font-extrabold px-4 py-3 md:py-4 rounded-xl transition-all text-xl shadow-sm ${getActiveCellData()?.repeatStart ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50'}`}
                  title="Toggle start repeat bracket"
                >
                  [
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleRepeat(activeCell.sec, activeCell.r, activeCell.c, 'repeatEnd');
                  }}
                  className={`border-2 font-extrabold px-4 py-3 md:py-4 rounded-xl transition-all text-xl shadow-sm ${getActiveCellData()?.repeatEnd ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50'}`}
                  title="Toggle end repeat bracket"
                >
                  ]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* A4 Print Container - Dynamic scaling to fit all content on A4 visually */}
      <div
        className="fixed top-0 left-0"
        style={{
          opacity: isCapturing ? 1 : 0,
          pointerEvents: 'none',
          zIndex: isCapturing ? 50 : -50,
          visibility: isCapturing ? 'visible' : 'hidden',
          width: '794px',
          height: '1123px'
        }}
      >
        <div
          ref={printRef}
          className="flex flex-col"
          style={{ width: '794px', height: '1123px', padding: '24px 32px', boxSizing: 'border-box', backgroundColor: '#ffffff', overflow: 'hidden', WebkitTextSizeAdjust: '100%' }}
        >
          {/* Print Header */}
          <div className="text-center border-b-2" style={{ borderColor: '#e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <h1 className="font-extrabold mb-1" style={{ color: '#1e293b', fontFamily: 'sans-serif', fontSize: '24px', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 20px' }}>{songName || 'Untitled Song'}</h1>
            <div className="flex items-center justify-center gap-6">
              {songScale && <p className="font-semibold" style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: '16px' }}>Key: {songScale}</p>}
              {timeSignature && <p className="font-semibold" style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: '16px' }}>Time: {timeSignature}</p>}
            </div>
          </div>

          {/* Print Chords Content */}
          <div className="flex-1" style={{ gap: printMb, display: 'flex', flexDirection: 'column' }}>
            {sections.map((section) => {
              const hasChords = section.rows.some(row => row.some(cell => cell.chord?.trim() !== ''));
              if (!hasChords) return null;

              return (
                <div key={section.id} className="page-break-inside-avoid">
                  <h2 className="font-bold" style={{ color: '#334155', fontFamily: 'sans-serif', fontSize: '18px', marginBottom: '8px' }}>{section.name}</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: printGap }}>
                    {section.rows.map((row, rIndex) => (
                      <div key={rIndex} className="grid grid-cols-4" style={{ gap: '16px' }}>
                        {row.map((cell, cIndex) => (
                          <div
                            key={cIndex}
                            className="border-2 rounded-xl relative"
                            style={{ 
                              backgroundColor: '#f8fafc', 
                              borderColor: '#cbd5e1', 
                              height: printBoxHeight
                            }}
                          >
                            {/* Left Bracket */}
                            {cell.repeatStart && (
                              <div className="absolute left-4 inset-y-0 flex items-center">
                                <span style={{ fontSize: printTextSize, fontWeight: 900, color: '#1e293b', fontFamily: 'sans-serif' }}>[</span>
                              </div>
                            )}

                            {/* Chord Text explicitly centered absolutely */}
                            <div className="absolute inset-0 flex items-center justify-center px-1">
                              <span style={{ 
                                fontSize: printTextSize, 
                                fontWeight: 800, 
                                color: '#1e293b', 
                                fontFamily: 'sans-serif',
                                whiteSpace: 'nowrap'
                              }}>
                                {cell.chord && cell.chord.trim() !== '' ? cell.chord.trim() : '-'}
                              </span>
                            </div>

                            {/* Right Bracket */}
                            {cell.repeatEnd && (
                              <div className="absolute right-4 inset-y-0 flex items-center">
                                <span style={{ fontSize: printTextSize, fontWeight: 900, color: '#1e293b', fontFamily: 'sans-serif' }}>]</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center font-medium" style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: '14px', marginTop: 'auto', paddingTop: '20px' }}>
            Created with ChordBox
          </div>
        </div>
      </div>
    </div>
  );
}
