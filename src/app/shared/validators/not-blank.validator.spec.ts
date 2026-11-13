import { FormControl } from '@angular/forms';
import { notBlankValidator } from './not-blank.validator';
describe('notBlankValidator', () => {
  it('rejects spaces while accepting trimmed text', () => {
    expect(notBlankValidator(new FormControl('  '))).toEqual({ whitespace: true });
    expect(notBlankValidator(new FormControl(' Team '))).toBeNull();
  });
});
