import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

// Nenhum teste chama a API real: requisição sem handler falha o teste.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/**
 * O jsdom não implementa o <dialog> modal. Polyfill mínimo do comportamento do navegador:
 * showModal() abre, close() fecha e dispara "close", e o Esc dispara "cancel" e, se ninguém o
 * cancelar, fecha o diálogo aberto. A volta do foco fica com a aplicação, não com o polyfill.
 */
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
  document.addEventListener("keydown", (event) => {
    const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
    if (event.key !== "Escape" || !dialog) return;
    if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) dialog.close();
  });
}
