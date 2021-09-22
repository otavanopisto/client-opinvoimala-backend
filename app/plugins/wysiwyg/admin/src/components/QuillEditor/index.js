import React, { useState } from "react";
import PropTypes from "prop-types";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const Editor = ({ onChange, name, value }) => {
  const modules = {
    toolbar: [
      [
        { header: "1" },
        { header: "2" },
        { header: "3" },
        { header: "4" },
        { font: [] },
      ],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      modules={modules}
      onChange={(content, event, editor) => {
        onChange({ target: { name, value: content } });
      }}
    />
  );
};

export default Editor;
