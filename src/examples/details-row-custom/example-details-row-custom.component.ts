import { Component, ChangeDetectionStrategy, ViewChild, AfterViewInit } from '@angular/core';
import { DataService, Atom } from '../data.service';
import { Observable } from 'rxjs';
import { GridComponent, RowDetailsStatus, Command, RowDetails, Grid } from 'ng2-qgrid';

@Component({
	selector: 'example-details-row-custom',
	templateUrl: 'example-details-row-custom.component.html',
	styleUrls: ['example-details-row-custom.component.scss'],
	providers: [DataService],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleDetailsRowCustomComponent implements AfterViewInit {
	static id = 'details-row-custom';

	@ViewChild(GridComponent, { static: true }) grid: GridComponent;
	rows$: Observable<Atom[]>;

	toggleExpand = new Command({
		execute: (row) => {
			const { model } = this.grid;
			if (row) {
				const { status } = model.row();
				if (!status.has(row)) {
					model.row({
						status: new Map([[row, new RowDetailsStatus(true)]])
					});

					const { rows } = model.view();
					const gridService = this.qgrid.service(model);
					gridService.focus(rows.indexOf(row) + 1);

					return;
				}
			}

			model.row({
				status: new Map()
			});
		}
	});

	constructor(
		dataService: DataService,
		private qgrid: Grid
	) {
		this.rows$ = dataService.getAtoms();
	}

	ngAfterViewInit() {
		const { model } = this.grid;

		model.pagination({
			size: 10
		});

		model.style({
			row: (row, context) => {
				const ROW_DETAILS_HEIGHT = 140;
				if (row instanceof RowDetails) {
					context.class('row-details-height', {
						'height': `${ROW_DETAILS_HEIGHT}px`,
						'max-height': `${ROW_DETAILS_HEIGHT}px`,
						'min-height': `${ROW_DETAILS_HEIGHT}px`
					});
				}
			}
		});

		model.keyboardChanged.on(e => {
			const { codes, status } = e.state;
			if (status === 'down') {
				switch (codes[0]) {
					case 'enter':
					case 'space': {
						const { cell } = model.navigation();
						this.toggleExpand.execute(cell && cell.row);
						break;
					}
					case 'alt': {
						const rowNo = Number.parseInt(codes[1], 10);
						if (!Number.isNaN(rowNo)) {
							const { rows } = model.view();
							const { current, size } = model.pagination();
							const altRow = rows[rowNo + current * size];
							if (altRow) {
								this.toggleExpand.execute(altRow);
							}
						}
						break;
					}
				}
			}
		});

		model.mouseChanged.on(e => {
			const { code, status, target } = e.state;
			if (code === 'left' && status === 'up') {
				if (target && target.column.key !== 'name') {
					this.toggleExpand.execute(target.row);
				}
			}
		});
	}
}
