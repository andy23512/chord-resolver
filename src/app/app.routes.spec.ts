import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SamplePageComponent } from '../page/sample-page/sample-page.component';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
  });

  it('has one route, /sample, for the sample page', () => {
    expect(appRoutes).toHaveLength(1);
    expect(appRoutes[0].path).toBe('sample');
    expect(appRoutes[0].component).toBe(SamplePageComponent);
  });

  it('shows the sample page at /sample', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/sample', SamplePageComponent);
    expect(page).toBeInstanceOf(SamplePageComponent);
    expect(
      harness.routeNativeElement?.querySelectorAll('article'),
    ).toHaveLength(2);
  });

  // Current behavior (the README says so too): there is no route for "/" and
  // no redirect. The address itself is accepted, but nothing is shown there.
  it('accepts the root address but shows nothing there', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/');
    // no routed component, so the harness has no element to give
    expect(harness.routeNativeElement).toBeNull();
  });

  it('refuses any other address', async () => {
    await expect(
      TestBed.inject(Router).navigateByUrl('/nowhere'),
    ).rejects.toThrow(/Cannot match any routes/);
  });
});
