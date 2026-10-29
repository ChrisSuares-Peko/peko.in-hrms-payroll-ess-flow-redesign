import { FormData } from '../types';

type getFieldsByPageParams = {
    pages: FormData['pages'];
    pageIdx: number;
};

export function getFieldsByPage({ pages, pageIdx }: getFieldsByPageParams): string[] {
    const result: string[] = [];

    for (let pIdx = 0; pIdx <= pageIdx; pIdx += 1) {
        if (!pages) return [];
        const page = pages[pIdx];

        for (let sectionIdx = 0; sectionIdx < page.sections.length; sectionIdx += 1) {
            const section = page.sections[sectionIdx];

            for (let instanceIdx = 0; instanceIdx < section.instances.length; instanceIdx += 1) {
                const instance = section.instances[instanceIdx];

                for (let fieldIdx = 0; fieldIdx < instance.fields.length; fieldIdx += 1) {
                    const field = instance.fields[fieldIdx];

                    if (field?.name) {
                        result.push(
                            `pages.${pIdx}.sections.${sectionIdx}.instances.${instanceIdx}.fields.${fieldIdx}.value`
                        );
                    }
                }
            }
        }
    }

    return result;
}
