import { Node, mergeAttributes } from '@tiptap/core';
import { formatLabel } from './mergeFieldBuilder';

export default Node.create({
  name: 'mergeField',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      field: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-field'),
        renderHTML: (attributes) => ({
          'data-field': attributes.field,
        }),
      },
      label: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-label') ||
          formatLabel(element.getAttribute('data-field') || ''),
        renderHTML: (attributes) => ({
          'data-label': attributes.label || formatLabel(attributes.field || ''),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.merge-field',
        getAttrs: (element) => ({
          field: element.getAttribute('data-field'),
          label: element.getAttribute('data-label') || formatLabel(element.getAttribute('data-field') || ''),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { field } = node.attrs;
    return [
      'span',
      mergeAttributes(
        {
          class: 'merge-field',
          contenteditable: 'false',
        },
        HTMLAttributes
      ),
      `{{${field}}}`,
    ];
  },

  addCommands() {
    return {
      insertMergeField:
        (attrs) =>
        ({ chain }) => {
          const payload = typeof attrs === 'string' ? { field: attrs } : attrs;
          return chain()
            .focus()
            .insertContent({ type: 'mergeField', attrs: payload })
            .run();
        },
    };
  },
});
