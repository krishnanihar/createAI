
import React, { useState, useEffect, useMemo, ChangeEvent, useRef } from 'react';

type StyleObject = { [key: string]: any };

interface StyleDnaDisplayProps {
  styleDescription: string;
  onStyleDescriptionChange: (value: string) => void;
  diffSource?: string;
}

// A simple, safe parsing function
const parseStyle = (jsonString: string): StyleObject | null => {
  if (!jsonString || typeof jsonString !== 'string') return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

const EditableField: React.FC<{
    label: string,
    value: string,
    onValueChange: (newValue: string) => void,
    isModified: boolean,
}> = ({ label, value, onValueChange, isModified }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);
    
    const handleBlur = () => {
        setIsEditing(false);
        onValueChange(localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalValue(value);
        }
    };
    
    return (
        <div className={`transition-colors ${isModified ? 'bg-yellow-900/30 rounded-md -m-1 p-1' : ''}`}>
            <span className="font-semibold text-slate-300 capitalize">{label.replace(/([A-Z])/g, ' $1')}:</span>{' '}
            {isEditing ? (
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full text-sm text-slate-200 bg-slate-800 border border-slate-600 rounded-md p-1 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032]"
                />
            ) : (
                <span 
                    className="text-slate-200 hover:bg-slate-700 rounded px-1 cursor-pointer"
                    onClick={() => setIsEditing(true)}
                >
                    {value || <span className="text-slate-500 italic">empty</span>}
                </span>
            )}
        </div>
    );
};

const TagList: React.FC<{ 
    label: string,
    items: string[],
    onItemsChange: (newItems: string[]) => void,
    isModified: boolean
}> = ({ label, items, onItemsChange, isModified }) => {
    const handleTagRemove = (indexToRemove: number) => {
        onItemsChange(items.filter((_, index) => index !== indexToRemove));
    };

    const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItem = e.currentTarget.value.trim();
            if (newItem && !items.includes(newItem)) {
                onItemsChange([...items, newItem]);
                e.currentTarget.value = '';
            }
        }
    };
    
    return (
        <div className={`transition-colors ${isModified ? 'bg-yellow-900/30 rounded-md -m-1 p-1' : ''}`}>
            <h4 className="font-semibold text-slate-300 capitalize">{label.replace(/([A-Z])/g, ' $1')}:</h4>
            <div className="flex flex-wrap gap-2 mt-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center bg-slate-700 text-slate-200 rounded-full px-2 py-0.5 text-sm border border-slate-600">
                        <span>{item}</span>
                        <button onClick={() => handleTagRemove(index)} className="ml-1.5 text-slate-400 hover:text-slate-200">&times;</button>
                    </div>
                ))}
                <input
                    type="text"
                    placeholder="+ Add"
                    onKeyDown={handleTagAdd}
                    className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none flex-grow"
                />
            </div>
        </div>
    )
};

const EditableColorPill: React.FC<{
    color: string;
    onUpdate: (newColor: string) => void;
    onRemove: () => void;
}> = ({ color, onUpdate, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localColor, setLocalColor] = useState(color);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalColor(color);
    }, [color]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        // Basic hex validation. Allow # followed by 3, 6, 8 hex digits.
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(localColor)) {
            onUpdate(localColor);
        } else {
            setLocalColor(color); // Revert on invalid
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalColor(color);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1.5 border border-slate-600 bg-slate-800 rounded-full px-2 py-0.5 ring-1 ring-[#B61032]">
                <div className="w-4 h-4 rounded-full border border-slate-500 shrink-0" style={{ backgroundColor: localColor }} />
                <input
                    ref={inputRef}
                    type="text"
                    value={localColor}
                    onChange={(e) => setLocalColor(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="font-mono text-xs w-20 bg-transparent text-slate-200 focus:outline-none"
                />
            </div>
        );
    }

    return (
        <div 
            className="flex items-center gap-1.5 border border-slate-600 bg-slate-800 rounded-full px-2 py-0.5 cursor-pointer hover:bg-slate-700 group"
            onClick={() => setIsEditing(true)}
        >
            <div className="w-4 h-4 rounded-full border border-slate-500" style={{ backgroundColor: color }} />
            <span className="font-mono text-xs text-slate-300">{color}</span>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-1 text-slate-400 hover:text-slate-200 text-base leading-none opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        </div>
    );
};

const EditableColorList: React.FC<{ 
    label: string,
    items: string[], // hex codes
    onItemsChange: (newItems: string[]) => void,
    isModified: boolean
}> = ({ label, items, onItemsChange, isModified }) => {
    
    const handleColorChange = (indexToChange: number, newColor: string) => {
        const newItems = items.map((item, index) => index === indexToChange ? newColor : item);
        onItemsChange(newItems);
    };

    const handleColorRemove = (indexToRemove: number) => {
        onItemsChange(items.filter((_, index) => index !== indexToRemove));
    };

    const handleColorAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItem = e.currentTarget.value.trim();
            if (newItem && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(newItem) && !items.includes(newItem)) {
                onItemsChange([...items, newItem]);
                e.currentTarget.value = '';
            }
        }
    };
    
    return (
        <div className={`transition-colors ${isModified ? 'bg-yellow-900/30 rounded-md -m-1 p-1' : ''}`}>
            <h4 className="font-semibold text-slate-300 capitalize">{label.replace(/([A-Z])/g, ' $1')}:</h4>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
                {items.map((color, index) => (
                    <EditableColorPill
                        key={`${color}-${index}`}
                        color={color}
                        onUpdate={(newColor) => handleColorChange(index, newColor)}
                        onRemove={() => handleColorRemove(index)}
                    />
                ))}
                 <input
                    type="text"
                    placeholder="+ Add Color"
                    onKeyDown={handleColorAdd}
                    className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none flex-grow"
                    style={{minWidth: '80px'}}
                />
            </div>
        </div>
    )
};


export const StyleDnaDisplay: React.FC<StyleDnaDisplayProps> = ({ styleDescription, onStyleDescriptionChange, diffSource }) => {
  const style = useMemo(() => parseStyle(styleDescription), [styleDescription]);
  const diffStyle = useMemo(() => diffSource ? parseStyle(diffSource) : null, [diffSource]);

  if (!style) {
    return (
        <div className="text-slate-400 bg-slate-900 p-4 rounded-md border border-slate-700">
            <p className="font-semibold mb-2 text-slate-300">Could not parse Style Analysis</p>
            <p className="text-sm">The style description is not valid JSON. Please correct it or re-analyze your assets.</p>
        </div>
    );
  }

  const handleFieldChange = (path: string[], newValue: any) => {
      const newStyle = JSON.parse(JSON.stringify(style)); // Deep copy
      let current = newStyle;
      for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
      }
      current[path[path.length - 1]] = newValue;
      onStyleDescriptionChange(JSON.stringify(newStyle, null, 2));
  };
  
  const isModified = (path: string[]): boolean => {
    if (!diffStyle) return false;
    let oldVal = diffStyle;
    let newVal = style;
    try {
        for (const key of path) {
            oldVal = oldVal[key];
            newVal = newVal[key];
        }
        return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    } catch {
        return true; // Path doesn't exist in one, so it's a change
    }
  }

  const renderSection = (title: string, data: StyleObject, path: string[]) => {
      return (
        <div key={title} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <h3 className="text-lg font-bold text-slate-200 capitalize mb-3">{title.replace(/([A-Z])/g, ' $1')}</h3>
            <div className="space-y-3 text-sm">
                {Object.entries(data).map(([key, value]) => {
                    const currentPath = [...path, key];
                    if (Array.isArray(value) && value.every(i => typeof i === 'string')) {
                         if (key.toLowerCase().includes('color')) {
                             return <EditableColorList key={key} label={key} items={value} onItemsChange={(newItems) => handleFieldChange(currentPath, newItems)} isModified={isModified(currentPath)} />;
                         }
                        return <TagList key={key} label={key} items={value} onItemsChange={(newItems) => handleFieldChange(currentPath, newItems)} isModified={isModified(currentPath)} />;
                    }
                    if (typeof value === 'string') {
                        return <EditableField key={key} label={key} value={value} onValueChange={(newValue) => handleFieldChange(currentPath, newValue)} isModified={isModified(currentPath)} />;
                    }
                    return null;
                })}
            </div>
        </div>
      )
  };

  return (
    <div className="space-y-4">
        {Object.entries(style).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return renderSection(key, value, [key]);
            }
            if (typeof value === 'string') {
                return (
                     <div key={key} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <EditableField label={key} value={value} onValueChange={(newValue) => handleFieldChange([key], newValue)} isModified={isModified([key])} />
                     </div>
                )
            }
            if (Array.isArray(value)) {
                 return (
                     <div key={key} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <TagList label={key} items={value} onItemsChange={(newItems) => handleFieldChange([key], newItems)} isModified={isModified([key])} />
                     </div>
                 )
            }
            return null;
        })}
    </div>
  );
};