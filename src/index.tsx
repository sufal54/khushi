/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./App.css";
import { StoreProvider } from "./context/StoreContext";

render(
  () => (
    <StoreProvider>
      <App />
    </StoreProvider>
  ),
  document.getElementById("root")!,
);
