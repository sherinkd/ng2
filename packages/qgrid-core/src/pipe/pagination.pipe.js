import { Guard } from '../infrastructure/guard';
import { hasOwnProperty } from '../utility/kit';

function paginate(model, rows) {
  const { pinTop, pinBottom } = model.row();
  const { mode } = model.scroll();
  let { current } = model.pagination();
  const { size }  = model.pagination();

  const pinned = new Set([...pinTop, ...pinBottom]);
  if (pinned.size) {
    rows = rows.filter(row => !pinned.has(row));
  }

  const count = rows.length;
  const last = Math.max(0, Math.floor((count - 1) / size));
  current = Math.min(last, current);
  const start = current * size;

  model.pagination({ count, current }, { source: 'pagination.pipe', behavior: 'core' });
  return mode === 'virtual' ? rows : rows.slice(start, start + size);
}

export function paginationPipe(memo, context, next) {
  Guard.notNull(memo, 'memo');

  const { model } = context;

  if (hasOwnProperty.call(memo, 'nodes') && memo.nodes.length) {
    const { flattenFactory } = model.group();

    const page = paginate(model, memo.nodes);
    const flatten = flattenFactory(model);

    memo.rows = flatten(page);
    next(memo);
    return;
  }

  if (hasOwnProperty.call(memo, 'rows')) {
    const page = paginate(model, memo.rows);
    memo.rows = page;
    next(memo);
    return;
  }

  const rows = paginate(model, memo);
  next(rows);
}
