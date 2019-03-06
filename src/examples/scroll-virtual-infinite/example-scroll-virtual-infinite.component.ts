import { Component, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../data.service';
import { GridComponent, Grid } from 'ng2-qgrid';

@Component({
	selector: 'example-scroll-virtual-infinite',
	templateUrl: 'example-scroll-virtual-infinite.component.html',
	styleUrls: ['example-scroll-virtual-infinite.component.scss'],
	providers: [DataService],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExampleScrollVirtualInfiniteComponent implements AfterViewInit {
	@ViewChild(GridComponent) myGrid;

	constructor(private dataService: DataService, private qgrid: Grid) {
	}

	ngAfterViewInit() {
		const { model } = this.myGrid;

		model.data({
			pipe: [
				(rows, context, next) => {
					const { skip } = model.fetch();
					const { size } = model.pagination();

					this.dataService
						.getAtoms()
						.subscribe(atoms => {
							const newPage = atoms.slice(skip, skip + size);
							next(rows.concat(newPage));
						});

				}].concat(this.qgrid.pipeUnit.view)
		});
	}
}
