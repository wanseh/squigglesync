import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestStoresComponent } from './test-stores.component';
import { ConnectionStore, UserStore, WhiteboardStore } from './core/store';

describe('TestStoresComponent', () => {
  let component: TestStoresComponent;
  let fixture: ComponentFixture<TestStoresComponent>;
  let connectionStore: ConnectionStore;
  let userStore: UserStore;
  let whiteboardStore: WhiteboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestStoresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestStoresComponent);
    component = fixture.componentInstance;
    connectionStore = TestBed.inject(ConnectionStore);
    userStore = TestBed.inject(UserStore);
    whiteboardStore = TestBed.inject(WhiteboardStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject all stores', () => {
    expect(component.connectionStore).toBeTruthy();
    expect(component.userStore).toBeTruthy();
    expect(component.whiteboardStore).toBeTruthy();
  });

  it('should display connection store values', () => {
    connectionStore.setDisconnected();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const connectedText = compiled.querySelector('p')?.textContent;
    expect(connectedText).toContain('Connected: false');
    expect(compiled.textContent).toContain('Status: disconnected');
  });

  it('should display connected state', () => {
    connectionStore.setConnected('test-session-123');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connected: true');
    expect(compiled.textContent).toContain('Status: connected');
  });

  it('should display user store values', () => {
    userStore.setUser('user-123', 'Test User');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('User ID: user-123');
    expect(compiled.textContent).toContain('User Name: Test User');
  });

  it('should display empty user values initially', () => {
    userStore.clearUser();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('User ID: ');
    expect(compiled.textContent).toContain('User Name: ');
  });

  it('should display whiteboard store values', () => {
    whiteboardStore.setRoom('room-456');
    whiteboardStore.addEvent({
      type: 'DRAW_LINE',
      userId: 'user-123',
      roomId: 'room-456',
      timestamp: Date.now(),
      sequence: 1,
      points: [[0, 0], [10, 10]],
      color: '#000000',
      strokeWidth: 2,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Room: room-456');
    expect(compiled.textContent).toContain('Event Count: 1');
  });

  it('should display empty whiteboard values initially', () => {
    whiteboardStore.reset();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Room: ');
    expect(compiled.textContent).toContain('Event Count: 0');
  });

  it('should reactively update when store values change', () => {
    connectionStore.setDisconnected();
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connected: false');

    connectionStore.setConnected('new-session');
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connected: true');
  });

  it('should log connection status changes in effect', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    connectionStore.setDisconnected();
    fixture.detectChanges();

    connectionStore.setConnected('session-123');
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Connection status:',
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });
});

