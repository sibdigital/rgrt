import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import {
	AlignmentType,
	Document,
	HeadingLevel,
	Packer,
	PageOrientation,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun, VerticalAlign, WidthType,
} from 'docx';
import moment from 'moment';

import { hasPermission } from '../../../authorization';

Meteor.methods({
	async downloadWorkingGroupParticipants({ workingGroup }) {
		if (!hasPermission(this.userId, 'manage-working-group')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!workingGroup) {
			throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', { method: 'downloadWorkingGroupParticipants', field: '_id' });
		}

		const doc = new Document();

		let usersRows = [
			new TableRow({
				tableHeader: true,
				children: [
					new TableCell({
						children: [new Paragraph({ text: '№', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 5,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'ФИО участника', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Рабочая группа', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Организация', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Должность', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Номер телефона', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Электронная почта', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
				],
			}),
		];

		usersRows = usersRows.concat(workingGroup.map((value, index) => {
			return new TableRow({
				children: [
					new TableCell({
						children: [new Paragraph({ text: `${ index + 1 }`, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 5,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: `${ value.surname } ${ value.name } ${ value.patronymic }`.trim(), alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: `${ value.workingGroup }`, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 5,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: `${ value.organization }`, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: `${ value.position }`, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: `${ value.phone }`, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: `${ value.emails[0].address ?? '' }`, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						alignment: AlignmentType.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
				],
			});
		},
		));


		doc.addSection({
			size: {
				orientation: PageOrientation.LANDSCAPE,
			},
			children: [
				new Paragraph({
					children: [
						new TextRun({
							text: `Отчет сформирован ${ moment(new Date()).format('DD MMMM YYYY, HH:mm') }`,
						}),
					],
					alignment: AlignmentType.RIGHT,
				}),
				new Paragraph({
					children: [
						new TextRun({
							text: 'Рабочая группа',
						}),
					],
					heading: HeadingLevel.HEADING_1,
					alignment: AlignmentType.CENTER,
				}),
				new Table({
					rows: usersRows,
					width: {
						size: 100,
						type: WidthType.PERCENTAGE,
					},
					cantSplit: true,
				}),
			],
		});

		const buffer = await Packer.toBuffer(doc);

		return buffer;
	},
});
