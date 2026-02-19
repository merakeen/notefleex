import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#18123b",
          colorTextBase: "#18123b",
          colorBgBase: "#efe5f4",
          colorBorder: "#d9cceb",
          borderRadius: 14,
          borderRadiusLG: 20,
          borderRadiusSM: 10,
          controlHeight: 40,
          fontFamily: '"Nunito Sans", "Segoe UI", Tahoma, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 42,
            paddingInline: 18,
            fontWeight: 700,
          },
          Input: {
            controlHeight: 42,
          },
          Segmented: {
            itemActiveBg: "#ffffff",
            itemSelectedBg: "#ffffff",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
