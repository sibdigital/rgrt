import styled, { keyframes } from 'styled-components';
import { slideInLeft, slideInRight, slideInUp, slideInDown } from 'react-animations';

/* @keyframes duration | timing-function | delay |
   iteration-count | direction | fill-mode | play-state | name */

export function getAnimation({ type, duration = '0.2s', timingFunction = 'linear', ...props }) {
	if (!type) {
		return;
	}

	let animationType = '';
	switch (type) {
		case 'slideInLeft':
			animationType = slideInLeft;
			break;
		case 'slideInRight':
			animationType = slideInRight;
			break;
		case 'slideInUp':
			animationType = slideInUp;
			break;
		case 'slideInDown':
			animationType = slideInDown;
			break;
		default:
			break;
	}

	const SlideAnimation = styled.div`animation: ${ duration } ${ keyframes`${ animationType }` } ${ timingFunction }`;

	return SlideAnimation;
}
