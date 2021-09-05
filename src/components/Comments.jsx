import React, { useEffect } from 'react';

const commentNodeId = 'comments';

const Comments = () => {
  useEffect(() => {

    const script = document.createElement('script'); 

    script.src = 'https://utteranc.es/client.js'; 
    script.async = true; 
    script.setAttribute('repo', 'marcosceo/spacetraveling-blog-comments'); 
    script.setAttribute('issue-term', 'pathname'); 
    script.setAttribute('label', 'comment :speech_balloon:'); 
    script.setAttribute('theme', 'photon-dark'); 
    script.setAttribute('crossorigin', 'anonymous'); 

    const scriptParentNode = document.getElementById(commentNodeId); 

    scriptParentNode.appendChild(script);

    return () => {
      // cleanup - remove the older script with previous theme
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, []);

  return <div style={{width: '721px', margin: '0 auto'}} id={commentNodeId} />;
};

export default Comments;