import { Meteor } from 'meteor/meteor';
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
import { Councils, Persons } from '../../../models';

Meteor.methods({
	async downloadCouncilParticipants({ _id, dateString }) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', { method: 'downloadCouncilParticipants', field: '_id' });
		}

		const council = await Councils.findOne({ _id });

		const persons = Persons.find({ _id: { $in: council.invitedPersons.map((iPerson) => iPerson._id) } }) || [];
		const sorted = Persons.findByIdSorted(council.invitedPersons.map((iPerson) => iPerson._id));

		if (!council) {
			throw new Meteor.Error('error-the-field-is-required', `The council with _id: ${ _id } doesn't exist`, { method: 'downloadCouncilParticipants', field: '_id' });
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
						children: [new Paragraph({ text: 'Участник', bold: true, alignment: AlignmentType.CENTER })],
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
					new TableCell({
						children: [new Paragraph({ text: 'Номер телефона', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Заявлен', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
				],
			}),
		];
		if (council.invitedPersons) {
			const getTS = (_id) => {
				const iPerson = council.invitedPersons.find((iPerson) => iPerson._id === _id);
				if (!iPerson) {
					return '';
				}
				return iPerson.ts;
			};
			usersRows = usersRows.concat(persons.map((value, index) => {
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
							children: [new Paragraph({ text: `${ value.surname?.toUpperCase() || '' } ${ value.name ?? '' } ${ value.patronymic ?? '' }`.trim(), alignment: AlignmentType.CENTER })],
							verticalAlign: VerticalAlign.CENTER,
							alignment: AlignmentType.CENTER,
							width: {
								size: 19,
								type: WidthType.PERCENTAGE,
							},
						}),
						new TableCell({
							// children: [new Paragraph({ text: `${ value.emails ? value.emails[0].address : '' }`, alignment: AlignmentType.CENTER })],
							children: [new Paragraph({ text: `${ value.email ?? '' }`, alignment: AlignmentType.CENTER })],
							verticalAlign: VerticalAlign.CENTER,
							alignment: AlignmentType.CENTER,
							width: {
								size: 19,
								type: WidthType.PERCENTAGE,
							},
						}),
						new TableCell({
							children: [new Paragraph({ text: `${ value.phone ?? '' }`, alignment: AlignmentType.CENTER })],
							verticalAlign: VerticalAlign.CENTER,
							alignment: AlignmentType.CENTER,
							width: {
								size: 19,
								type: WidthType.PERCENTAGE,
							},
						}),
						new TableCell({
							children: [new Paragraph({ text: `${ moment(new Date(getTS(value._id))).format('DD MMMM YYYY, HH:mm') }`, alignment: AlignmentType.CENTER })],
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
			),
			);
		}

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
							text: council.type?.title ?? 'Совещание',
						}),
					],
					heading: HeadingLevel.HEADING_1,
					alignment: AlignmentType.CENTER,
				}),
				new Paragraph({
					children: [
						new TextRun({
							text: `От ${ dateString ?? moment(council.d).format('DD MMMM YYYY, HH:mm') }`,
						}),
					],
					heading: HeadingLevel.HEADING_2,
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
