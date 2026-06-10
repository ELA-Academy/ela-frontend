import { useEffect } from "react";

// Updates the height of a textarea dynamically based on its content.
const useAutosizeTextArea = (textAreaRef, value) => {
  useEffect(() => {
    if (textAreaRef) {
      // We need to reset the height momentarily to get the correct scrollHeight for the new content
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;

      // We then set the height directly, adding a little extra for padding
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};

export default useAutosizeTextArea;
