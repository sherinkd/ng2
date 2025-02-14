import { ColumnView } from '../scene/view/column.view';
import { TemplatePath } from '../template/template.path';
import { ColumnModel } from './column.model';

TemplatePath.register('row-details-cell', (template, column) => ({
  model: template.for,
  resource: column.key,
}));

export class RowDetailsColumnModel extends ColumnModel {
  constructor() {
    super('row-details');

    this.key = '$row.details';
    this.category = 'control';

    this.canEdit = false;
    this.canResize = false;
    this.canHighlight = false;
    this.canFilter = false;
    this.canSort = false;
    this.canMove = false;
  }
}

export class RowDetailsColumn extends ColumnView {
  constructor(model) {
    super(model);
  }

  static model(model) {
    return model ? RowDetailsColumn.assign(model) : new RowDetailsColumnModel();
  }
}
