// eslint-disable-next-line node/no-unpublished-import
import type TypedEventEmitter from 'typed-emitter';
import type { DidRegisterDocumentFormattingEditProviderNotificationParams } from '../server';

/**
 * VS Code extension event names.
 */
export interface ExtensionEvents {
	DidRegisterDocumentFormattingEditProvider: (
		params: DidRegisterDocumentFormattingEditProviderNotificationParams,
	) => void;
	DidResetConfiguration: () => void;
}

/**
 * VS Code extension public API.
 */
export type PublicApi = TypedEventEmitter<ExtensionEvents> & {
	codeActionReady: boolean;
};

/**
 * Extension API event names.
 */
export enum ApiEvent {
	DidRegisterDocumentFormattingEditProvider = 'DidRegisterDocumentFormattingEditProvider',
	DidResetConfiguration = 'DidResetConfiguration',
}
