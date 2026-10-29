const { expect } = require('@playwright/test');
import { CommonLocators } from './Locators';
const { cashAccountLocators } = require('../CUS_CashAccount/Locators');
const APIActions = require('../../lib/APIActions');
let ENV_NAME = process.env.ENV_NAME;
let GlobalSearchData;
let NotificationTemplateData;
let CashAccountData;


async function loadGlobalSearchData() {
    const apiActions = new APIActions();
    const Data = await apiActions.readDataFromJSONFile(`${ENV_NAME}`);
    GlobalSearchData = Data.GlobalSearchData;
}

async function loadNotificationTemplateData() {
    const apiActions = new APIActions();
    const Data = await apiActions.readDataFromJSONFile(`${ENV_NAME}`);
    NotificationTemplateData = Data.NotificationTemplateData;
}
async function loadCashAccountData() {
    const apiActions = new APIActions();
    const Data = await apiActions.readDataFromJSONFile(`${ENV_NAME}`);
    CashAccountData = Data.CashAccountData;
}



class Common {
    constructor(page) {
        this.page = page;
    }

    async handleEnablePushNotificationIfVisible() {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const popupSelector = 'text="Enable Push Notifications"';
        const buttonSelector = 'button:has-text("Enable Push Notifications")';
        const overlaySelector = '.gtn-modal-overlay';
        try {
            // If we navigated away (auth redirect / page closed), skip.
            if (this.page.isClosed()) return;
            const url = this.page.url();
            if (url.includes('/auth/') || url.includes('authenticationendpoint') || url.includes('/login')) return;

            const popupLocator = this.page.locator(popupSelector);
            const buttonLocator = this.page.locator(buttonSelector);
            // Wait max 2s for popup to exist in DOM
            const popupPresent = await popupLocator.count().catch(() => 0) > 0;

            if (popupPresent) {
                console.log('Popup found — trying to click enable');
                await buttonLocator.first().click({ timeout: 4000 });
                // Wait for modal overlay to disappear
                await this.page.waitForSelector(overlaySelector, { state: 'detached', timeout: 4000 });

                console.log('Popup handled successfully');
            } else {
                console.log('No popup found in DOM — skipping');
            }
        } catch (err) {
            console.error('Error handling push notification popup:', err);
            // Facelift/SPA can navigate while we're checking; don't fail the test because of this optional popup.
            return;
        }
    }

    async changeInstitution(institutionName) {
        // Light-weight waits to give Axis shell time to stabilise after login
        await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

        // If institution selector is not available, skip gracefully
        const instButton = this.page.locator(CommonLocators.InstitutionButton).first();
        const hasInstButton = await instButton.count().catch(() => 0);
        if (!hasInstButton) {
            console.warn('Institution selector not found; skipping changeInstitution.');
            return;
        }

        // If the desired institution is already visible (usually in header chip), do nothing
        const isInstitutionVisible = await this.page
            .getByText(institutionName, { exact: false })
            .first()
            .isVisible()
            .catch(() => false);

        if (!isInstitutionVisible) {
            await instButton.waitFor({ state: 'visible', timeout: 30000 });
            await instButton.click();

            await this.page.getByPlaceholder('Search Institutions').fill(institutionName);

            // Select institution option
            await this.page.getByRole('button', { name: institutionName }).click({ force: true });

            const confirmButton = this.page.getByRole('button', { name: CommonLocators.confirm });
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }
        }
    }

    async changeLanguage(language) {
        await this.page.locator(CommonLocators.language_dropdown).click();
        await this.page.waitForSelector(CommonLocators.language_dropdown, { visible: true, timeout: 5000 });
        await this.page.getByRole('link', { name: language, exact: true }).click();
        const current_language = await this.page.locator(CommonLocators.current_lan);
        await current_language.waitFor({ state: 'visible' });
        await expect(current_language).toHaveText(language);
    }

    async changeTheme() {
        await this.page.locator(CommonLocators.linear_icon_dropdown).click();
        await this.page.locator(CommonLocators.theme_dropdown).click();
        const bodyClassAfter = await this.page.evaluate(() => document.body.className);
        await this.page.locator(CommonLocators.dark_theme).click();

        if (bodyClassAfter.includes(CommonLocators.dark_theme)) {
            console.log('Theme successfully changed to Dark!');
        } else {
            console.error('Theme change failed!');
        }

        await this.page.locator(CommonLocators.linear_icon_dropdown).click();
        await this.page.locator(CommonLocators.theme_dropdown).click();
        await this.page.locator(CommonLocators.light_theme).click();
        const finalBodyClass = await this.page.evaluate(() => document.body.className);
        console.log(`Final theme class: ${finalBodyClass}`); // Should show the light theme class

        if (finalBodyClass.includes(CommonLocators.light_theme)) {
            console.log('Theme successfully changed back to Light!');
        } else {
            console.error('Failed to revert theme to Light!');
        }
    }

    async changeLanguageAfterLogin() {
        await this.page.locator(CommonLocators.linear_icon_dropdown).click();
        await this.page.locator(CommonLocators.lang_dropdown).click();
        await this.page.locator(CommonLocators.arabic).click();
        await this.page.locator(CommonLocators.linear_icon_dropdown).click();
        await this.page.locator(CommonLocators.lang_dropdown).click();
        await this.page.locator(CommonLocators.english).click();
        //await expect(current_language).toHaveText(language);
    }

    async closeAllTabs() {
        // Use locator-based approach (resilient to post-login navigations).
        const url = (() => {
            try { return this.page.url(); } catch { return ''; }
        })();
        if (String(url).includes('/auth') || String(url).includes('authenticationendpoint')) return;

        // If there's more than just the Dashboard tab, close others.
        const tabText = this.page.locator('.tab-text');
        await tabText.first().waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
        const tabNames = await tabText.allTextContents().catch(() => []);
        const hasNonDashboardTab = tabNames.some(n => (n || '').trim() && (n || '').trim() !== 'Dashboard');
        if (!hasNonDashboardTab) return;

        // Exact flow provided by you (with waits + one retry for stability).
        const closeAllTabsBtn = this.page.getByLabel('Close all tabs').getByRole('button').first();
        await closeAllTabsBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        const canOpen = await closeAllTabsBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (!canOpen) return;

        await closeAllTabsBtn.click({ timeout: 5000 }).catch(async () => {
            await this.page.waitForTimeout(500);
            await closeAllTabsBtn.click({ timeout: 5000 }).catch(() => {});
        });

        const selectAll = this.page.getByLabel('Select All').first();
        await selectAll.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await selectAll.check({ timeout: 5000 }).catch(async () => {
            // Fallback if it isn't a real checkbox in some builds.
            await selectAll.click({ timeout: 5000 }).catch(() => {});
        });

        const closeSelected = this.page.getByRole('button', { name: 'Close Selected Tabs' }).first();
        await closeSelected.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await closeSelected.click({ timeout: 5000 }).catch(() => {});

        const confirm = this.page.getByRole('button', { name: 'Confirm' }).first();
        await confirm.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await confirm.click({ timeout: 5000 }).catch(() => {});

        // Best-effort wait for only Dashboard to remain.
        await this.page.waitForTimeout(500);
        await this.page.waitForFunction(() => {
            const els = Array.from(document.querySelectorAll('.tab-text'));
            const names = els.map(e => (e.textContent || '').trim()).filter(Boolean);
            return names.length === 0 || (names.length === 1 && names[0] === 'Dashboard');
        }).catch(() => {});
    }

    async linkToHelpDocumentation() {
        await this.page.locator(CommonLocators.linear_icon_dropdown).click();
        //await this.page.getByText(CommonLocators.help_text).click();
        await this.page.getByText(CommonLocators.help_text, { exact: true }).click();
        //await this.page.getByText('Help', { exact: true }).click();
        expect(this.page.locator(CommonLocators.user_manual)).toBeDefined();
    }

    async sendEmailForStatement() {
        await loadNotificationTemplateData();
        await this.page.waitForTimeout(180000);
        await this.page.getByRole('button', { name: 'Refresh' }).click();
        await this.page.getByText(CommonLocators.send_via_email).first().click();
        await this.page.locator('[name="cc"]').click();
        await this.page.locator('[name="cc"]').fill(NotificationTemplateData.senderEmail);
        await this.page.locator('[name="cc"]').press('Enter');
        await this.page.locator(`${CommonLocators.filled_button} >> text = ${CommonLocators.send_text}`).click();
        await this.page.locator(`${CommonLocators.filled_button} >> text = ${CommonLocators.confirm_text}`).click();
        await expect(this.page.getByText(CommonLocators.email_sent_success_mg)).toBeVisible({ timeout: 5000 });
        await this.page.waitForTimeout(5000);
        await expect(this.page.locator(`${CommonLocators.green_chip} >> text = ${CommonLocators.email_sent_text}`).first()).toBeVisible();
    }

    async openFifteenTabs() {
        const customers = await this.page.locator(CommonLocators.customer_no_cell);
        for (let i = 0, j = 0; i < 16; j++) {
            const element = customers.nth(j);
            await element.click();
            let tabCount = await this.page.locator(CommonLocators.tab_class).count();
            if (i == tabCount && i == 15) {
                break;
            }
            i = tabCount;
            await this.page.locator(CommonLocators.tab_class).filter({ hasText: CommonLocators.customer_list_tab_text, exact: true }).click();
        }
    }

    async verifyManageTabsPopup() {
        await expect(this.page.getByText(CommonLocators.manage_tabs_text)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.reachDesc)).toBeVisible();

    }




    //Global Search

    async closeGlobalSearchIfOpen() {
        const trigger = this.page.locator(CommonLocators.GlobalSearch).first();
        const isOpen = (await trigger.getAttribute('aria-expanded').catch(() => null)) === 'true';
        if (!isOpen) {
            return;
        }

        const closeBtn = this.page.locator(CommonLocators.CloseBtn).first();
        const hasCloseBtn = await closeBtn.isVisible().catch(() => false);
        if (hasCloseBtn) {
            await closeBtn.click({ timeout: 5000 }).catch(() => {});
        }

        const stillOpen = (await trigger.getAttribute('aria-expanded').catch(() => null)) === 'true';
        if (stillOpen) {
            await this.page.keyboard.press('Escape').catch(() => {});
        }

        const stillOpenAfterEsc = (await trigger.getAttribute('aria-expanded').catch(() => null)) === 'true';
        if (stillOpenAfterEsc) {
            await trigger.click();
        }
    }

    async navigateToGlobalSearch() {
        const trigger = this.page.locator(CommonLocators.GlobalSearch).first();
        const isOpen = (await trigger.getAttribute('aria-expanded').catch(() => null)) === 'true';
        if (!isOpen) {
            await trigger.click();
        }
    }

    async FeaturesInGlobalSearch() {
        await loadGlobalSearchData();
        await this.page.getByText(CommonLocators.Features, { exact: true }).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).fill(GlobalSearchData.FeatureInput);

        await this.page.waitForTimeout(2000);

    }

    async AssertFeaturesInGlobalSearch() {
        await expect(this.page.getByText(CommonLocators.FeatureHead).nth(1)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.CustomerList).nth(1)).toBeVisible();
        await this.page.waitForTimeout(1000);
        //await expect(this.page.getByText(CommonLocators.CustomerSummary)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.CustomerMasterAccounts).nth(1)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.CustOnReq).nth(1)).toBeVisible();
        await this.page.waitForTimeout(1000);
        await this.closeGlobalSearchIfOpen();
        console.log("Global Search assertions are done for the features")

    }

    async ExactFeatureInGlobalSearch() {
        await loadGlobalSearchData();
        await this.page.getByText(CommonLocators.Features, { exact: true }).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).fill(GlobalSearchData.ExactFeatureInput);
        await this.page.waitForTimeout(2000);
    }

    async AssertExactFeatureInGlobalSearch() {
        await expect(this.page.getByText(CommonLocators.FeatureHead).nth(1)).toBeVisible();
        const exactCustomerSummary = this.page.locator(CommonLocators.ExactCustSumm);
        const hasExactLocator = (await exactCustomerSummary.count().catch(() => 0)) > 0;

        if (hasExactLocator) {
            await expect(exactCustomerSummary.first()).toHaveText('Customer Summary');
        } else {
            await expect(this.page.getByText(CommonLocators.CustomerSummary).first()).toBeVisible();
        }
        await this.page.waitForTimeout(1000);
        console.log("Global Search assertion is done for the Customer Summary")
    }

    async CustomersInGlobalSearch() {
        await loadGlobalSearchData();
        await this.page.getByText(CommonLocators.Customers, { exact: true }).nth(1).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).fill(GlobalSearchData.CustomersInput);
        await this.page.waitForTimeout(2000);
    }

    async AssertCustomersInGlobalSearch() {
        await expect(this.page.getByText(CommonLocators.CustomerHead).nth(2)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.Customer1)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.Customer2)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.Customer3)).toBeVisible();
        await this.page.waitForTimeout(1000);
        await this.closeGlobalSearchIfOpen();
        console.log("Global Search assertions are done for the customers")
    }

    async ExactCustomerInGlobalSearch() {
        await loadGlobalSearchData();
        await this.page.getByText(CommonLocators.Customers, { exact: true }).nth(1).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).fill(GlobalSearchData.ExactCustomersInput);
        await this.page.waitForTimeout(2000);
    }

    async AssertExactCustomerInGlobalSearch() {
        await expect(this.page.getByText(CommonLocators.CustomerHead).nth(2)).toBeVisible();
        const exactCustomerResult = this.page.locator(CommonLocators.ExactCustomer);
        const hasExactLocator = (await exactCustomerResult.count().catch(() => 0)) > 0;

        if (hasExactLocator) {
            await expect(exactCustomerResult.first()).toHaveText('AT V2 CUSTOMER');
        } else {
            await expect(this.page.getByText(CommonLocators.Customer1).first()).toBeVisible();
        }
        await this.page.waitForTimeout(1000);
        console.log("Global Search assertion is done for the AT V2 Customer")
    }


    async AllOptionInGlobalSearch() {
        await loadGlobalSearchData();
        await this.page.locator(CommonLocators.AllOptions, { exact: true }).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).click();
        await this.page.locator(CommonLocators.GlobalSearchInput).fill(GlobalSearchData.FeatureInput);
        await this.page.waitForTimeout(2000);
    }

    async AssertAllInGlobalSearch() {
        await expect(this.page.getByText(CommonLocators.FeatureHead).nth(0)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.CustomerHead).nth(1)).toBeVisible();
        await this.page.getByText(CommonLocators.TodayOrdersHead).nth(1).scrollIntoViewIfNeeded();
        await expect(this.page.getByText(CommonLocators.TodayOrdersHead).nth(1)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.CustomerList).nth(1)).toBeVisible();
        //await expect(this.page.getByText(CommonLocators.CustomerSummary)).toBeVisible();
        await expect(this.page.getByText(CommonLocators.CustomerMasterAccounts).nth(1)).toBeVisible();
        await this.page.waitForTimeout(1000);
        console.log("Global Search assertion is done for the 'All' option")
    }

    //Notification Management
    async navigateToNotificationManagement() {
        await loadNotificationTemplateData();
        await this.page.locator(CommonLocators.sidebar_configurations_btn).click();
        await this.page.locator(CommonLocators.sidebar_submenu_panel).waitFor({ state: 'visible' });
        await this.page.getByRole('link', { name: CommonLocators.Menu_notificationManagement }).click();
    }

    async addNotificationTemplateType() {
        await this.page.getByLabel(CommonLocators.addNotificationTemplateTypeBtn).click();
        await this.page.locator(CommonLocators.notificationTemplateTypeField).click();
        await this.page.locator(CommonLocators.notificationTemplateTypeField).fill(NotificationTemplateData.NotificationType);
        await this.page.getByRole('option', { name: NotificationTemplateData.NotificationType }).click();

        await this.page.getByLabel(CommonLocators.allowedTypeEmail).check();
        await this.page.getByLabel(CommonLocators.allowedTypeSMS).check();

        await this.page.locator(CommonLocators.sender).click();
        await this.page.locator(CommonLocators.sender).fill(NotificationTemplateData.senderEmail);
        await this.page.locator(CommonLocators.description).click();
        await this.page.locator(CommonLocators.description).fill(NotificationTemplateData.Description);
        await this.page.getByRole('button', { name: CommonLocators.saveBtn }).click();
        await this.page.getByRole('button', { name: CommonLocators.confirmBtn }).click();
    }

    async deleteNotificationTemplateType() {
        const row = this.page.locator(CommonLocators.anniversaryTemplateRow.base).filter({ hasText: CommonLocators.anniversaryTemplateRow.filter }).first();
        await row.scrollIntoViewIfNeeded();
        await row.click();
        const deleteBtn = this.page.getByRole('button', { name: CommonLocators.deletenotificationTemplateTypeBtn });
        await deleteBtn.scrollIntoViewIfNeeded();
        await deleteBtn.click();
        await this.page.getByRole('button', { name: CommonLocators.confirmBtn }).click();
        await expect(this.page.getByText('Deleted Successfully')).toBeVisible();
    }

    async editNotificationTemplateType() {
        const row = this.page.locator(CommonLocators.editAnniversaryTemplateRow.base).filter({ hasText: CommonLocators.editAnniversaryTemplateRow.filter }).first();
        await row.click();
        await this.page.getByRole('button', { name: CommonLocators.editnotificationTemplateTypeBtn }).click();
        await this.page.getByLabel(CommonLocators.allowedTypeSMS).uncheck();
        await this.page.getByRole('button', { name: CommonLocators.saveBtn, exact: true }).click();
        await this.page.getByRole('button', { name: CommonLocators.confirmBtn }).click();
        await expect(this.page.getByText('Changes Saved Successfully')).toBeVisible();
    }

    async addNotificationEmailTemplateBody() {
        await this.page.getByText(NotificationTemplateData.NotificationType).first().click();
        await this.page.getByRole('button', { name: CommonLocators.addNotificationTemplateBtn }).nth(1).click();
        await this.page.getByPlaceholder(CommonLocators.enterEmailSubj).click();
        await this.page.getByPlaceholder(CommonLocators.enterEmailSubj).fill(NotificationTemplateData.emailsubject);
        await this.page.locator(CommonLocators.emailTemplate).click();
        await this.page.locator(CommonLocators.emailTemplate).fill(NotificationTemplateData.emailtemplateid);
        await this.page.locator('.border > div:nth-child(2) > .h-100').click();
        await this.page.locator('.border > div:nth-child(2) > .h-100').fill(NotificationTemplateData.emailBody);
        await this.page.getByRole('button', { name: CommonLocators.savechangesbtn }).click();
        await this.page.getByRole('button', { name: CommonLocators.confirmBtn }).click();
    }

    async addNotificationSMSTemplateBody() {
        await this.page.getByText(NotificationTemplateData.NotificationType).first().click();
        await this.page.getByRole('button', { name: CommonLocators.addNotificationTemplateBtn }).nth(1).click();
        await this.page.getByText(CommonLocators.smstemplateTab).click();
        await this.page.locator(CommonLocators.smsTemplateID).click();
        await this.page.locator(CommonLocators.smsTemplateID).fill(NotificationTemplateData.smsTemplateid);
        await this.page.locator('.border > div:nth-child(2) > .h-100').click();
        await this.page.locator('.border > div:nth-child(2) > .h-100').fill(NotificationTemplateData.smsBody);
        await this.page.getByRole('button', { name: CommonLocators.savechangesbtn }).click();
        await this.page.getByRole('button', { name: CommonLocators.confirmBtn }).click();
        await this.page.getByText('Changes saved successfully').click();
    }

    async deleteNotificationTemplateBody() {
        await this.page.getByText(NotificationTemplateData.NotificationType).first().click();
        await this.page.getByText(NotificationTemplateData.NotificationType).first().click();
        await this.page.getByRole('button', { name: CommonLocators.deleteNotificationTemplateBtn }).nth(1).click();
        await this.page.getByRole('button', { name: CommonLocators.confirmBtn }).click();
        await this.page.getByText('Deleted Successfully').click();
    }

    async navigateToDownloadsTab() {
        await this.page.getByLabel(CommonLocators.Download_Icon).click();
    }

    //Send email for Bond Holding Statement
    async changeCashAccountforFixedIncome() {
            await loadCashAccountData();
            await this.page.locator(cashAccountLocators.cashAccDropdown).first().click();
            const cashAccLocator = this.page.getByRole('option', { name: new RegExp(`^${CashAccountData.cashAccForBondHoldingStatement}`) });
            await cashAccLocator.waitFor({ state: 'visible' });
            await cashAccLocator.click();
            await this.page.waitForTimeout(5000);
            console.log('Cash Account Changed');
    }
    async SelectCurrentMonth() {
            await this.page.locator(CommonLocators.cashStatementCurrentMonthSelectloc).click();
    }
}
module.exports = { Common };
