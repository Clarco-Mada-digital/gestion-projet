import React, { useState, useEffect } from 'react';

// Client-only wrapper for MDEditor
const MDEditorClient = (props: any) => {
  const [MDEditor, setMDEditor] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    import('@uiw/react-md-editor').then((module) => {
      setMDEditor(() => module.default);
    });
  }, []);

  // Only render on client side when MDEditor is loaded
  if (!isClient || !MDEditor) {
    return <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />;
  }
  
  return <MDEditor {...props} />;
};

MDEditorClient.displayName = 'MDEditorClient';

export default MDEditorClient;
