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
import { Councils, Users } from '../../../models';

Meteor.methods({
	async downloadCouncilParticipants({ _id, dateString }) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field _id is required', { method: 'downloadCouncilParticipants', field: '_id' });
		}

		const council = Councils.findOne({ _id });
		const users = Users.find({ _id: { $in: council.invitedUsers } }) || [];

		if (!council) {
			throw new Meteor.Error('error-council-does-not-exists', `The council with _id: ${ _id } doesn't exist`, { method: 'downloadCouncilParticipants', field: '_id' });
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
						children: [new Paragraph({ text: 'Должность с указанием названия организации', bold: true, alignment: AlignmentType.CENTER })],
						verticalAlign: VerticalAlign.CENTER,
						width: {
							size: 19,
							type: WidthType.PERCENTAGE,
						},
					}),
					new TableCell({
						children: [new Paragraph({ text: 'Контактное лицо', bold: true, alignment: AlignmentType.CENTER })],
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
		if (council.invitedUsers) {
			usersRows = usersRows.concat(users.map((value, index) => {
				const contactFace = value.contactPersonFirstName ? `${ value.contactPersonLastName } ${ value.contactPersonFirstName } ${ value.contactPersonPatronymicName }`.trim() : '-';
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
							children: [new Paragraph({ text: `${ value.position ?? '' }`, alignment: AlignmentType.CENTER })],
							verticalAlign: VerticalAlign.CENTER,
							alignment: AlignmentType.CENTER,
							width: {
								size: 19,
								type: WidthType.PERCENTAGE,
							},
						}),
						new TableCell({
							children: [new Paragraph({ text: contactFace, alignment: AlignmentType.CENTER })],
							verticalAlign: VerticalAlign.CENTER,
							alignment: AlignmentType.CENTER,
							width: {
								size: 19,
								type: WidthType.PERCENTAGE,
							},
						}),
						new TableCell({
							children: [new Paragraph({ text: `${ value.emails ? value.emails[0].address : '' }`, alignment: AlignmentType.CENTER })],
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
							children: [new Paragraph({ text: `${ moment(new Date(value.ts)).format('DD MMMM YYYY, HH:mm') }`, alignment: AlignmentType.CENTER })],
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
							text: 'Совещание',
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
