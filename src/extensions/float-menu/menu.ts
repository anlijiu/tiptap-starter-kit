import { Editor, Extension, Range, isActive, isNodeSelection, isTextSelection } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { FloatMenuView } from "./view";

export interface FloatMenuItem {
  id: string;
  name: string;
  view: string;
  shortcut?: string;
  active: (props: { editor: Editor; view: FloatMenuView; range: Range; element: HTMLElement }) => boolean;
  action: (props: { editor: Editor; view: FloatMenuView; range: Range; element: HTMLElement }) => void;
  onInit?: (props: { editor: Editor; view: FloatMenuView; range: Range; element: HTMLElement }) => void;
  onUpdate?: (props: { editor: Editor; view: FloatMenuView; range: Range; element: HTMLElement }) => void;
  onDestroy?: (props: { editor: Editor; view: FloatMenuView; range: Range; element: HTMLElement }) => void;
}

export interface FloatMenuItemStorage {
  floatMenu?: {
    hide?: boolean;
    items?: FloatMenuItem | Array<FloatMenuItem>;
  };
}

export interface FloatMenuOptions {
  items: Array<string>;
}

export const FloatMenu = Extension.create<FloatMenuOptions>({
  name: "floatMenu",
  addOptions() {
    return {
      items: [
        "Bold",
        "Italic",
        "Strike",
        "Underline",
        "|",
        "Code",
        "Highlight",
        "Link",
        "|",
        "Superscript",
        "Subscript",
      ],
    };
  },
  addProseMirrorPlugins() {
    const hiddens = new Set<string>();
    const mappings = new Map<string, FloatMenuItem>();
    console.log("float-menu/menu.ts this.editor.storage: ", this.editor.storage);
    for (const [name, storage] of Object.entries(this.editor.storage as Record<string, FloatMenuItemStorage>)) {
      // console.log("storage: ", storage)
      if (storage?.floatMenu) {
        if (storage.floatMenu.hide) {
          hiddens.add(name);
        }
        if (storage.floatMenu.items) {

          const menus = Array.isArray(storage.floatMenu.items) ? storage.floatMenu.items : [storage.floatMenu.items];
          console.log("storage.floatMenu.items: ", storage.floatMenu.items, " ,  menus: ", menus)
          for (const menu of menus) {
            mappings.set(menu.name, menu);
          }
        }
      }
    }

    console.log("mappings: ", mappings);
    if (!mappings.size || !this.options.items.length) {
      return [];
    }
    return [
      new Plugin({
        key: new PluginKey(`${this.name}-float-menu`),
        view: FloatMenuView.create({
          editor: this.editor,
          show: ({ editor }) => {
            const { state, isEditable } = editor;
            if (!isEditable) {
              return false;
            }
            const { selection, doc } = state;
            if (selection.empty) {
              return false;
            }
            const isEmptyTextBlock = !doc.textBetween(selection.from, selection.to).length && isTextSelection(selection);
            if (isEmptyTextBlock) {
              return false;
            }
            for (const hidden of hiddens) {
              if (isActive(state, hidden)) {
                return false;
              }
            }
            return !isNodeSelection(selection);
          },
          onInit: ({ view, range, editor, element }) => {
            for (const name of this.options.items) {
              if (name !== "|") {
                const item = mappings.get(name);

                console.log("item: ", name, item)
                if (item) {
                  const button = view.createButton({
                    id: name,
                    name: item.name,
                    view: item.view,
                    shortcut: item.shortcut,
                    onClick: () => item.action({ view, range, editor, element: button.button }),
                  });
                  element.append(button.button);
                  item.onInit?.({ view, range, editor, element: button.button });
                }
              } else {
                const divider = view.createDivider();
                element.append(divider.divider);
              }
            }
          },
          onUpdate: ({ view, range, editor, element }) => {
            for (const name of this.options.items) {
              if (name !== "|") {
                const dom = element.querySelector(`[name="${name}"]`) as HTMLElement | undefined;
                const item = mappings.get(name);
                if (dom && item) {
                  item.onUpdate?.({ view, range, editor, element: dom });
                  if (item.active({ view, range, editor, element: dom })) {
                    dom.classList.add("active");
                    continue;
                  }
                  dom.classList.remove("active");
                }
              }
            }
          },
          onDestroy: ({ view, range, editor, element }) => {
            for (const name of this.options.items) {
              if (name !== "|") {
                const dom = element.querySelector(`[name="${name}"]`) as HTMLElement | undefined;
                const item = mappings.get(name);
                if (dom && item) {
                  item.onDestroy?.({ view, range, editor, element: dom });
                }
              }
            }
          },
        }),
      }),
    ];
  },
});
