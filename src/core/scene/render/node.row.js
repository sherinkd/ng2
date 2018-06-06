import { DataRow } from './data.row';
import { takeWhile, dropWhile, sumBy } from '../../utility/kit';
import { columnFactory } from '../../column/column.factory';
import { Aggregation } from '../../services/aggregation';
import { AppError } from '../../infrastructure/error';
import { set as setValue } from '../../services/value';
import { findFirstLeaf } from '../../node/node.service';

export class NodeRow extends DataRow {
	constructor(model) {
		super(model);

		const createColumn = columnFactory(model);
		this.reference = {
			group: createColumn('group')
		};
	}

	columns(node, pin) {
		switch (node.type) {
			case 'row': {
				return this.columnList(pin);
			}
		}

		return super.columns(node, pin);
	}

	getValue(node, column, select) {
		const rows = this.model.data().rows;
		switch (node.type) {
			case 'group': {
				const aggregation = column.aggregation;
				if (aggregation) {
					if (!Aggregation.hasOwnProperty(aggregation)) {
						throw new AppError(
							'node.row',
							`Aggregation ${aggregation} is not registered`);
					}

					const groupRows = node.rows.map(i => rows[i]);
					return Aggregation[aggregation](groupRows, select, column.aggregationOptions);
				}

				return null;
			}
			case 'row': {
				const rowIndex = node.rows[0];
				return select(rows[rowIndex], column);
			}
			case 'value': {
				return select(node, column);
			}
			default:
				throw new AppError(
					'node.row',
					`Invalid node type ${node.type}`
				);
		}
	}

	setValue(node, column, value, rowIndex, columnIndex) {
		if (node.type === 'row') {
			const rows = this.model.data().rows;
			const rowIndex = node.rows[0];
			return setValue(rows[rowIndex], column, value);
		}

		return super.setValue(node, column, value, rowIndex, columnIndex);
	}

	setLabel(node, column, value, rowIndex, columnIndex) {
		if (node.type === 'row') {
			const rows = this.model.data().rows;
			const rowIndex = node.rows[0];
			return setLabel(rows[rowIndex], column, value);
		}

		return super.setLabel(node, column, value, rowIndex, columnIndex);
	}

	findGroupColumn(pin) {
		const columnList = this.columnList();
		let groupColumn = columnList.find(c => c.model.type === 'group');
		if (!groupColumn) {
			groupColumn = this.reference.group;
			if (groupColumn.model.pin === pin) {
				const firstColumn = this.columnList(pin)[0];
				groupColumn.index = firstColumn ? firstColumn.index : 0;
			}
		}

		return groupColumn.model.pin !== pin ? null : groupColumn;
	}
}

export class RowspanNodeRow extends NodeRow {
	constructor(model) {
		super(model);
	}


	getValue(node, column, select) {
		const rows = this.model.data().rows;
		switch (node.type) {
			case 'group': {
				const leaf = findFirstLeaf(node);
				if (leaf) {
					const rowIndex = leaf.rows[0];
					return select(rows[rowIndex], column);	
				}
				return null;
			}
		}

		return super.getValue(node, column, select);
	}

	rowspan(node, column, isRoot = true) {
		switch (node.type) {
			case 'group': {
				if (column.model.type === 'group') {
					if (node.state.expand) {
						if (!isRoot || node.source === column.model.by) {
							return node.children.reduce((memo, child, i) => memo + this.rowspan(child, column, false), 0);
						} else {
							if (node.children.length) {
								return this.rowspan(node.children[0], column, false);
							}
						}
					}
					return 1;
				}
			}
		}

		return super.rowspan(node, column);
	}

	columns(node, pin) {
		switch (node.type) {
			case 'group': {
				return dropWhile(this.columnList(pin), c => c.model.type === 'group' && c.model.by !== node.source);
			}
			case 'row': {
				return this.columnList(pin).filter(c => c.model.type !== 'group');
			}
		}

		return super.columns(node, pin);
	}
}

export class SubheadNodeRow extends NodeRow {
	constructor(model) {
		super(model);
	}

	colspan(node, column) {
		switch (node.type) {
			case 'group': {
				if (column.model.type === 'group') {
					const groupColumn = this.findGroupColumn(column.model.pin);
					if (groupColumn) {
						const columns = this.columnList(column.model.pin);
						const groupspan = takeWhile(columns, c => !c.model.aggregation);
						return sumBy(groupspan, c => c.colspan);
					}
				}
				break;
			}
		}

		return super.colspan(node, column);
	}

	columns(node, pin) {
		switch (node.type) {
			case 'group': {
				const groupColumn = this.findGroupColumn(pin);
				if (groupColumn) {
					const nextColumns = dropWhile(this.columnList(pin), c => !c.model.aggregation);
					return [groupColumn].concat(nextColumns);
				}
				break;
			}
		}

		return super.columns(node, pin);
	}
}
