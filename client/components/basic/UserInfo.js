import React from 'react';
import { Box, Margins, Tag, Button, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from './VerticalBar';
import { UTCClock } from './UTCClock';
import UserAvatar from './avatar/UserAvatar';
import UserCard from './UserCard';
import MarkdownText from './MarkdownText';

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const wordBreak = css`
	word-break: break-word;
`;

const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;
const Avatar = ({ username, ...props }) => <UserAvatar title={username} username={username} {...props}/>;
const Username = ({ username, status, ...props }) => <UserCard.Username name={username} status={status} {...props}/>;

export const UserInfo = React.memo(function UserInfo({
	username,
	bio,
	email,
	showRealNames,
	status,
	shortFio,
	organization,
	position,
	phone,
	customStatus,
	roles = [],
	lastLogin,
	createdAt,
	utcOffset,
	customFields = [],
	name,
	data,
	nickname,
	// onChange,
	actions,
	...props
}) {
	const t = useTranslation();

	const timeAgo = useTimeAgo();

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<Avatar size={'x332'} username={username}/>

		{actions}

		<Margins block='x4'>
			{shortFio && <>
				<Label>{t('Full_Name')}</Label>
				<Info>{shortFio}</Info>
			</>}
			{username && <>
				<Label>{ t('Username') }</Label>
				<UserCard.Username name={ username } status={ status } />
				<Info>{ customStatus }</Info>
			</>}

			{!!roles && <>
				<Label>{t('Roles')}</Label>
				<UserCard.Roles>{roles}</UserCard.Roles>
			</>}

			{Number.isInteger(utcOffset) && <>
				<Label>{t('Local_Time')}</Label>
				<Info><UTCClock utcOffset={utcOffset}/></Info>
			</>}

			<Label>{t('Last_login')}</Label>
			<Info>{lastLogin ? timeAgo(lastLogin) : t('Never')}</Info>

			{nickname && <>
				<Label>{t('Nickname')}</Label>
				<Info>{nickname}</Info>
			</>}

			{organization && <>
				<Label>{t('Organization')}</Label>
				<Info>{organization}</Info>
			</>}

			{position && <>
				<Label>{t('Position')}</Label>
				<Info>{position}</Info>
			</>}

			{bio && <>
				<Label>{t('Description')}</Label>
				<Info withTruncatedText={false}><MarkdownText content={bio}/></Info>
			</>}

			{phone && <> <Label>{t('Phone_number')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box is='a' withTruncatedText href={`tel:${ phone }`}>{phone}</Box>
				</Info>
			</>}

			{email && <> <Label>{t('Email')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box is='a' withTruncatedText href={`mailto:${ email.address }`}>{email.address}</Box>
					<Margins inline='x4'>
						{email.verified && <Tag variant='primary'>{t('Verified')}</Tag>}
						{email.verified || <Tag disabled>{t('Not_verified')}</Tag>}
					</Margins>
				</Info>
			</>}

			{ customFields && Object.entries(customFields).map(([label, value]) => <React.Fragment key={label}>
				<Label>{t(label)}</Label>
				<Info>{value}</Info>
			</React.Fragment>) }

			<Label>{t('Created_at')}</Label>
			<Info>{timeAgo(createdAt)}</Info>

		</Margins>

	</VerticalBar.ScrollableContent>;
});

export const Action = ({ icon, label, ...props }) => (
	<Button title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

UserInfo.Action = Action;
UserInfo.Avatar = Avatar;
UserInfo.Info = Info;
UserInfo.Label = Label;
UserInfo.Username = Username;

export default UserInfo;
