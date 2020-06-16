import { window } from "vscode";
import { IMenuItem } from "./iMenuItem";

export function createQuickPick(title: string, items: IMenuItem[]) {
    return new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick<IMenuItem>();
        quickPick.title = title;
        quickPick.items = items;

        let resolveOnAction = false;
        // Select with single key stroke
        const eventListenerDisposable = quickPick.onDidChangeValue(async () => {
            const chosenItems = quickPick.items.find(i => i.key === quickPick.value);
            if (chosenItems) {
                resolveOnAction = true;
                quickPick.hide();
                try {
                    await chosenItems.action();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        });

        // Select with arrows + enter
        const acceptListenerDisposable = quickPick.onDidAccept(async () => {
            if (quickPick.activeItems.length > 0) {
                const chosenItems = quickPick.activeItems[0] as IMenuItem;
                resolveOnAction = true;
                quickPick.hide();
                try {
                    await chosenItems.action();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        });

        const didHideDisposable = quickPick.onDidHide(() => {
            quickPick.dispose();
            eventListenerDisposable.dispose();
            acceptListenerDisposable.dispose();
            didHideDisposable.dispose();
            if (!resolveOnAction) {
                resolve();
            }
        });

        quickPick.show();
    });
}

export function createTransientQuickPick(title: string, items: IMenuItem[]) {
    return new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick<IMenuItem>();
        quickPick.title = title;
        quickPick.items = items;

        let disposeOnHidden = false;
        // Select with single key stroke
        const eventListenerDisposable = quickPick.onDidChangeValue(async () => {
            const chosenItems = quickPick.items.find(i => i.key === quickPick.value);
            if (chosenItems) {
                disposeOnHidden = false;
                quickPick.hide();
                try {
                    await chosenItems.action();
                    reshowQuickPick();
                } catch (error) {
                    dispose(false);
                    reject(error);
                }
            } else {
                disposeOnHidden = true;
                quickPick.hide();
            }
        });

        // Select with arrows + enter
        const acceptListenerDisposable = quickPick.onDidAccept(async () => {
            if (quickPick.activeItems.length > 0) {
                const chosenItems = quickPick.activeItems[0] as IMenuItem;
                disposeOnHidden = false;
                quickPick.hide();
                try {
                    await chosenItems.action();
                    reshowQuickPick();
                } catch (error) {
                    dispose(false);
                    reject(error);
                }
            }
        });

        const didHideDisposable = quickPick.onDidHide(() => {
            if (disposeOnHidden) {
                dispose(true);
            }
        });

        function reshowQuickPick() {
            quickPick.value = '';
            quickPick.items = [...quickPick.items];
            quickPick.show();
        }

        function dispose(shouldResolve: boolean) {
            quickPick.dispose();
            eventListenerDisposable.dispose();
            acceptListenerDisposable.dispose();
            didHideDisposable.dispose();
            if (shouldResolve) {
                resolve();
            }
        }

        quickPick.show();
    });
}