import React from 'react';

export default function SettingsPage() {
    return (
        <div className="space-y-10 divide-y divide-gray-900/10">
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base font-semibold leading-7 text-gray-900">Organization Profile</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                        Manage your tenant workspace details and white-labeling.
                    </p>
                </div>

                <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="company-name" className="block text-sm font-medium leading-6 text-gray-900">
                                    Company Name
                                </label>
                                <div className="mt-2">
                                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-600 sm:max-w-md">
                                        <input
                                            type="text"
                                            name="company-name"
                                            id="company-name"
                                            className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                            defaultValue="Acme Corp"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-4">
                                <label htmlFor="subdomain" className="block text-sm font-medium leading-6 text-gray-900">
                                    Workspace Subdomain
                                </label>
                                <div className="mt-2 text-sm text-gray-900">
                                    <span className="text-gray-500">acme.</span>hireflow-saas.com
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                        <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                            Save details
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base font-semibold leading-7 text-gray-900">SLA Webhooks & Notifications</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                        Configure external integrations for the workflow Observer Patterns (e.g. Slack alerts for SLA breaches).
                    </p>
                </div>

                <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="col-span-full">
                                <label htmlFor="webhook-url" className="block text-sm font-medium leading-6 text-gray-900">
                                    Slack Webhook URL
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="url"
                                        name="webhook-url"
                                        id="webhook-url"
                                        placeholder="https://hooks.slack.com/services/..."
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                        </div>

                        <fieldset className="mt-6">
                            <legend className="text-sm font-semibold leading-6 text-gray-900">Push Notifications</legend>
                            <div className="mt-4 space-y-4 text-sm leading-6 text-gray-600">
                                <div className="flex gap-x-3">
                                    <div className="flex h-6 items-center">
                                        <input id="sla-breach" name="notifications" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600" />
                                    </div>
                                    <label htmlFor="sla-breach" className="font-medium text-gray-900">SLA Deadline Breaches</label>
                                </div>
                                <div className="flex gap-x-3">
                                    <div className="flex h-6 items-center">
                                        <input id="score-submit" name="notifications" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600" />
                                    </div>
                                    <label htmlFor="score-submit" className="font-medium text-gray-900">New Scorecard Submissions</label>
                                </div>
                            </div>
                        </fieldset>

                    </div>
                    <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                        <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                            Update Webhooks
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
